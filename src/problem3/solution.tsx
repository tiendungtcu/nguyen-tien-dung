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
