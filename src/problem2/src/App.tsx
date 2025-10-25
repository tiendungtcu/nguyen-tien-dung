import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import './style.css';

const PRICE_URL = 'https://interview.switcheo.com/prices.json';
const ICON_BASE = 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens';
const FALLBACK_ICON = 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/USDC.svg';
const SLIPPAGE = 0.005;

type StatusTone = 'info' | 'success' | 'error';

interface StatusState {
  text: string;
  tone: StatusTone;
}

interface PriceEntry {
  currency: string;
  price: number;
  date?: string;
}

const formatNumber = (value: number, fractionDigits = 6) => {
  if (!Number.isFinite(value)) return '0.00';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(value);
};

const getIconUrl = (symbol: string) => `${ICON_BASE}/${symbol}.svg`;

const pickDefaultPair = (symbols: string[]): [string, string] => {
  if (symbols.length === 0) {
    return ['', ''];
  }
  const preferredOrder = ['USDC', 'ETH', 'BTC', 'ATOM'];
  const orderedMatches = preferredOrder.filter((token) => symbols.includes(token));
  const fromCandidate = orderedMatches[0] ?? symbols[0];
  let toCandidate = orderedMatches.find((token) => token !== fromCandidate);
  if (!toCandidate) {
    toCandidate = symbols.find((token) => token !== fromCandidate);
  }
  if (!toCandidate) {
    toCandidate = fromCandidate;
  }
  return [fromCandidate, toCandidate];
};

const App = () => {
  const [prices, setPrices] = useState<Map<string, number>>(new Map());
  const [tokens, setTokens] = useState<string[]>([]);
  const [fromToken, setFromToken] = useState('');
  const [toToken, setToToken] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [status, setStatus] = useState<StatusState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const submitTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const initialTheme = media.matches ? 'light' : 'dark';
    setTheme(initialTheme);

    const handler = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'light' : 'dark');
    };

    media.addEventListener('change', handler);
    return () => {
      media.removeEventListener('change', handler);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    const setTokenStateFallback = () => {
      setPrices(new Map());
      setTokens([]);
      setFromToken('');
      setToToken('');
    };

    const loadPrices = async () => {
      setStatus({ text: 'Loading live prices...', tone: 'info' });
      try {
        const response = await fetch(PRICE_URL);
        if (!response.ok) {
          throw new Error('Failed to load prices');
        }
        const payload: PriceEntry[] = await response.json();
        const latest = new Map<string, { price: number; timestamp: number }>();

        payload.forEach((entry) => {
          if (!entry.currency || !Number.isFinite(entry.price)) return;
          const timestamp = entry.date ? Date.parse(entry.date) : 0;
          const existing = latest.get(entry.currency);
          if (!existing || timestamp > existing.timestamp) {
            latest.set(entry.currency, { price: entry.price, timestamp });
          }
        });

        const compact = new Map<string, number>();
        latest.forEach((value, key) => {
          compact.set(key, value.price);
        });

        if (cancelled) return;

        const sortedTokens = [...compact.keys()].sort((a, b) => a.localeCompare(b));
        if (sortedTokens.length === 0) {
          throw new Error('No priced tokens present.');
        }
        const [defaultFrom, defaultTo] = pickDefaultPair(sortedTokens);

        setPrices(compact);
        setTokens(sortedTokens);
        setFromToken(defaultFrom);
        setToToken(defaultTo);
        setStatus({ text: 'Live prices ready -- start swapping!', tone: 'success' });
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        setTokenStateFallback();
        setStatus({ text: 'Unable to fetch live prices. Try refreshing the page.', tone: 'error' });
      }
    };

    loadPrices();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (submitTimerRef.current) {
        window.clearTimeout(submitTimerRef.current);
      }
    };
  }, []);

  const amountTrimmed = amountInput.trim();
  const amountValue = Number(amountTrimmed);
  const hasAmount = amountTrimmed.length > 0;
  const isValidAmount = Number.isFinite(amountValue) && amountValue > 0;
  const fromPrice = prices.get(fromToken);
  const toPrice = prices.get(toToken);
  const tokensReady = tokens.length > 0;
  const tokenPairReady = Boolean(fromToken && toToken && fromPrice && toPrice);
  const sameToken = tokenPairReady && fromToken === toToken;

  const quote = tokenPairReady && isValidAmount ? (amountValue * (fromPrice as number)) / (toPrice as number) : undefined;
  const netQuote = quote ? quote - quote * SLIPPAGE : undefined;
  const formattedNetQuote = netQuote ? formatNumber(netQuote, 6) : '0.00';

  let fromHint = '';
  let fromHintIsError = false;
  if (hasAmount && !isValidAmount) {
    fromHint = 'Enter a positive number.';
    fromHintIsError = true;
  } else if (isValidAmount && fromPrice) {
    const usdValue = amountValue * fromPrice;
    fromHint = `~ ${formatNumber(usdValue, 2)} USD`;
  }

  let toHint = '';
  let toHintIsError = false;
  if (!fromPrice || !toPrice) {
    toHint = 'Select two priced tokens to preview the swap.';
  } else if (sameToken) {
    toHint = 'Choose two different tokens to continue.';
    toHintIsError = true;
  } else {
    toHint = `Estimated slippage ${formatNumber(SLIPPAGE * 100, 2)}%`;
  }

  const rateSummary = fromPrice && toPrice
    ? `1 ${fromToken} = ${formatNumber((fromPrice as number) / (toPrice as number), 6)} ${toToken}`
    : 'Rates unavailable';

  const submitDisabled = submitting || !tokenPairReady || !isValidAmount || sameToken || status?.tone === 'error';
  const primaryButtonClasses = [
    'group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-4 text-xs font-semibold uppercase tracking-[0.35em] text-white shadow-glow transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200 sm:text-sm',
    submitting ? 'cursor-wait opacity-80' : submitDisabled ? 'cursor-not-allowed opacity-60' : 'hover:-translate-y-0.5 hover:brightness-110',
  ].join(' ');

  const statusClasses = status
    ? [
        'rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm backdrop-blur transition-colors duration-200',
        status.tone === 'success'
          ? 'border-emerald-400/60 bg-emerald-400/10 text-green-900'
          : status.tone === 'error'
          ? 'border-rose-400/60 bg-rose-500/10 text-rose-100'
          : 'border-cyan-300/60 bg-cyan-400/10 text-cyan-100',
      ].join(' ')
    : '';

  const topMovers = useMemo(() => {
    return [...prices.entries()]
      .filter(([, price]) => price >= 0.0001)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [prices]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitDisabled || !netQuote) {
      return;
    }

    setSubmitting(true);
    setStatus({ text: 'Routing best price across pools...', tone: 'info' });

    if (submitTimerRef.current) {
      window.clearTimeout(submitTimerRef.current);
    }

    submitTimerRef.current = window.setTimeout(() => {
      setSubmitting(false);
      setStatus({
        text: `Swap confirmed! You paid ${formatNumber(amountValue, 6)} ${fromToken} for approximately ${formatNumber(netQuote, 6)} ${toToken}.`,
        tone: 'success',
      });
    }, 1100);
  };

  const handleFlip = () => {
    if (!tokensReady) return;
    setFromToken(toToken);
    setToToken(fromToken);
  };

  const handleThemeToggle = () => {
    setTheme((prev: 'light' | 'dark') => (prev === 'light' ? 'dark' : 'light'));
  };

  const themeLabel = theme === 'light' ? 'Moon' : 'Sun';

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 text-slate-900 transition-colors duration-500 dark:bg-midnight dark:bg-mesh dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          <section className="flex flex-col gap-6 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-glow backdrop-blur dark:border-white/10 dark:bg-white/10 md:p-8" aria-live="polite">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-300">Token swap</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Swap assets instantly</h1>
              </div>
              <button
                type="button"
                id="theme-toggle"
                aria-label="Toggle theme"
                onClick={handleThemeToggle}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 dark:border-white/10 dark:bg-white/10 dark:text-indigo-200"
              >
                {themeLabel}
              </button>
            </header>

            <form id="swap-form" noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em]" htmlFor="from-amount">
                    You pay
                  </label>
                  <button
                    type="button"
                    id="flip-button"
                    onClick={handleFlip}
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500 transition hover:text-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200 dark:text-indigo-300"
                  >
                    Invert pair
                  </button>
                </div>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
                  <div className="flex w-full items-center gap-3 md:w-auto">
                    <img
                      id="from-token-icon"
                      alt=""
                      className="h-11 w-11 rounded-full border border-slate-200/70 bg-white/80 p-2 object-contain dark:border-white/10 dark:bg-white/10"
                      src={getIconUrl(fromToken)}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = FALLBACK_ICON;
                      }}
                    />
                    <select
                      id="from-token"
                      aria-label="Token you are sending"
                      value={fromToken}
                      onChange={(event) => setFromToken(event.target.value)}
                      disabled={!tokensReady}
                      className="w-full appearance-none bg-transparent text-lg font-semibold text-slate-900 outline-none transition focus:text-indigo-600 dark:text-slate-100 dark:focus:text-indigo-300"
                    >
                      {!tokensReady && <option value="">Loading tokens...</option>}
                      {tokens.map((symbol) => (
                        <option key={symbol} value={symbol}>
                          {symbol}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    id="from-amount"
                    inputMode="decimal"
                    placeholder="0.00"
                    autoComplete="off"
                    value={amountInput}
                    onChange={(event) => setAmountInput(event.target.value)}
                    className="w-full rounded-2xl bg-white/60 px-4 py-3 text-left text-3xl font-semibold tracking-tight text-slate-900 outline-none ring-1 ring-transparent transition placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-300 dark:bg-white/10 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-indigo-400 md:text-right"
                  />
                </div>
                <p id="from-hint" className={`text-sm ${fromHintIsError ? 'text-rose-400' : 'text-slate-500 dark:text-slate-300'}`}>
                  {fromHint}
                </p>
              </div>

              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em]" htmlFor="to-amount">
                    You receive
                  </label>
                  <output id="rate-summary" className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500 dark:text-indigo-300">
                    {rateSummary}
                  </output>
                </div>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
                  <div className="flex w-full items-center gap-3 md:w-auto">
                    <img
                      id="to-token-icon"
                      alt=""
                      className="h-11 w-11 rounded-full border border-slate-200/70 bg-white/80 p-2 object-contain dark:border-white/10 dark:bg-white/10"
                      src={getIconUrl(toToken)}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = FALLBACK_ICON;
                      }}
                    />
                    <select
                      id="to-token"
                      aria-label="Token you are receiving"
                      value={toToken}
                      onChange={(event) => setToToken(event.target.value)}
                      disabled={!tokensReady}
                      className="w-full appearance-none bg-transparent text-lg font-semibold text-slate-900 outline-none transition focus:text-indigo-600 dark:text-slate-100 dark:focus:text-indigo-300"
                    >
                      {!tokensReady && <option value="">Loading tokens...</option>}
                      {tokens.map((symbol) => (
                        <option key={symbol} value={symbol}>
                          {symbol}
                        </option>
                      ))}
                    </select>
                  </div>
                  <output
                    id="to-amount"
                    role="status"
                    className="w-full rounded-2xl bg-white/60 px-4 py-3 text-left text-3xl font-semibold tracking-tight text-slate-900 ring-1 ring-transparent dark:bg-white/10 dark:text-white md:text-right"
                  >
                    {formattedNetQuote}
                  </output>
                </div>
                <p id="to-hint" className={`text-sm ${toHintIsError ? 'text-rose-400' : 'text-slate-500 dark:text-slate-300'}`}>
                  {toHint}
                </p>
              </div>

              <div className="flex flex-col gap-1 rounded-2xl border border-dashed border-slate-200/80 bg-white/60 p-5 text-[0.75rem] uppercase tracking-[0.3em] text-slate-500 dark:border-indigo-300/40 dark:bg-white/5 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs font-semibold tracking-[0.35em] text-slate-500 dark:text-slate-300">Slippage tolerance</span>
                <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{formatNumber(SLIPPAGE * 100, 2)}%</span>
              </div>

              <button type="submit" id="submit-button" className={primaryButtonClasses} disabled={submitDisabled}>
                <span className={`h-5 w-5 rounded-full border-2 border-white/40 border-t-white transition-opacity ${submitting ? 'opacity-100 animate-spin' : 'opacity-0'}`} aria-hidden="true"></span>
                <span className="text-center">Confirm swap</span>
              </button>
            </form>

            {status?.text && (
              <section id="status-banner" className={statusClasses} role="alert">
                {status.text}
              </section>
            )}
          </section>

          <aside className="flex flex-col gap-4 rounded-3xl border border-slate-200/60 bg-white/70 p-6 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5 md:p-8" aria-live="polite">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-2xl">Market spotlight</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Compare live prices fetched from the Switcheo interview API. Select any two tokens to preview the current swap rate.
            </p>
            <ul id="top-movers" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {topMovers.map(([symbol, price]) => (
                <li
                  key={symbol}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/60 px-4 py-3 shadow-sm backdrop-blur transition hover:border-indigo-200 hover:shadow-lg dark:border-white/10 dark:bg-white/5"
                >
                  <img
                    alt=""
                    className="h-10 w-10 rounded-full border border-slate-200/70 bg-white/80 p-2 object-contain dark:border-white/10 dark:bg-white/10"
                    src={getIconUrl(symbol)}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = FALLBACK_ICON;
                    }}
                  />
                  <div className="flex w-full items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-900 dark:text-white">{symbol}</span>
                    <span className="text-slate-500 dark:text-slate-300">${formatNumber(price, price > 100 ? 2 : 4)}</span>
                  </div>
                </li>
              ))}
              {topMovers.length === 0 && (
                <li className="rounded-2xl border border-dashed border-slate-200/70 bg-white/60 px-4 py-3 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  No priced tokens available.
                </li>
              )}
            </ul>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default App;
