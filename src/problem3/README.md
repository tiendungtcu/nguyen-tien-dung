# WalletPage Review

## Inefficiencies and anti-patterns
- **Missing typings**: `WalletBalance` omits the `blockchain` property even though the component relies on it, forcing downstream code into `any` and bypassing TypeScript guarantees.
- **Incorrect filter predicate**: `sortedBalances` keeps only balances with `amount <= 0` because it returns `true` for non-positive amounts; positive balances never render.
- **Undeclared identifier**: The filter callback references `lhsPriority` which does not exist, resulting in a ReferenceError and a broken render.
- **Redundant computations**: `getPriority` runs repeatedly inside `filter` and `sort`. Coupled with no memoisation for `prices`, this recalculates priorities and USD values on every render.
- **Wrong memo dependencies**: `useMemo` for `sortedBalances` depends on `prices` even though `prices` is unused; it should depend on `balances` (and the priority map if dynamic).
- **Formatting bug**: `toFixed()` defaults to zero decimal places, so the UI shows integers even for fractional token amounts.
- **Key anti-pattern**: Using `index` as the React key in `rows` causes unstable identity when balances change order.
- **Error handling gap**: Accessing `prices[balance.currency]` without null checks can produce `NaN` USD values and break the UI.
- **Styling reference**: `classes.row` is undefined in the provided snippet, so the component likely throws.
- **Derived array duplication**: Both `formattedBalances` and `rows` derive from `sortedBalances` without memoisation, recreating arrays every render and re-rendering children unnecessarily.

## Original component

```tsx
interface WalletBalance {
  currency: string;
  amount: number;
}
interface FormattedWalletBalance {
  currency: string;
  amount: number;
  formatted: string;
}

interface Props extends BoxProps {

}
const WalletPage: React.FC<Props> = (props: Props) => {
  const { children, ...rest } = props;
  const balances = useWalletBalances();
  const prices = usePrices();

	const getPriority = (blockchain: any): number => {
	  switch (blockchain) {
	    case 'Osmosis':
	      return 100
	    case 'Ethereum':
	      return 50
	    case 'Arbitrum':
	      return 30
	    case 'Zilliqa':
	      return 20
	    case 'Neo':
	      return 20
	    default:
	      return -99
	  }
	}

  const sortedBalances = useMemo(() => {
    return balances.filter((balance: WalletBalance) => {
		  const balancePriority = getPriority(balance.blockchain);
		  if (lhsPriority > -99) {
		     if (balance.amount <= 0) {
		       return true;
		     }
		  }
		  return false
		}).sort((lhs: WalletBalance, rhs: WalletBalance) => {
			const leftPriority = getPriority(lhs.blockchain);
		  const rightPriority = getPriority(rhs.blockchain);
		  if (leftPriority > rightPriority) {
		    return -1;
		  } else if (rightPriority > leftPriority) {
		    return 1;
		  }
    });
  }, [balances, prices]);

  const formattedBalances = sortedBalances.map((balance: WalletBalance) => {
    return {
      ...balance,
      formatted: balance.amount.toFixed()
    }
  })

  const rows = sortedBalances.map((balance: FormattedWalletBalance, index: number) => {
    const usdValue = prices[balance.currency] * balance.amount;
    return (
      <WalletRow 
        className={classes.row}
        key={index}
        amount={balance.amount}
        usdValue={usdValue}
        formattedAmount={balance.formatted}
      />
    )
  })

  return (
    <div {...rest}>
      {rows}
    </div>
  )
}
```

## Refactored component
```tsx
import { Box, BoxProps } from "@mui/material";
import { useMemo } from "react";

interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string;
}

interface FormattedWalletBalance extends WalletBalance {
  formattedAmount: string;
  usdValue: number;
}

const PRIORITY_MAP: Record<string, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};

const getPriority = (blockchain: string): number =>
  PRIORITY_MAP[blockchain] ?? -1;

interface Props extends BoxProps {}

export const WalletPage: React.FC<Props> = ({ children, ...rest }) => {
  const balances = useWalletBalances();
  const prices = usePrices();

  const sortedBalances = useMemo(() => {
    return balances
      .filter(
        (balance: WalletBalance) => balance.amount > 0 && getPriority(balance.blockchain) >= 0
      )
      .sort(
        (lhs: WalletBalance, rhs: WalletBalance) => getPriority(rhs.blockchain) - getPriority(lhs.blockchain)
      );
  }, [balances]);

  const formattedBalances = useMemo<FormattedWalletBalance[]>(() => {
    return sortedBalances.map((balance: FormattedWalletBalance) => {
      const price = prices[balance.currency] ?? 0;
      const usdValue = price * balance.amount;
      return {
        ...balance,
        usdValue,
        formattedAmount: balance.amount.toFixed(4),
      };
    });
  }, [sortedBalances, prices]);

  return (
    <Box {...rest}>
      {formattedBalances.map((balance) => (
        <WalletRow
          key={balance.currency}
          amount={balance.amount}
          usdValue={balance.usdValue}
          formattedAmount={balance.formattedAmount}
        />
      ))}
      {children}
    </Box>
  );
};

```

### Additional improvements
- Memoise `WalletRow` if it remains simple but re-renders frequently.
- Move `PRIORITY_MAP` and formatting helpers into a shared module to keep the component lean.
- Guard `usePrices()` with suspense/loading states so the UI can show skeletons instead of flashing error banners.
