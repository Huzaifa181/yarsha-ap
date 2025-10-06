import {format, isToday, isYesterday} from 'date-fns';
import {TransformedTransaction} from './walletSignatures';

type SectionedTransaction = {
  title: string;
  data: TransformedTransaction[];
};

export const groupTransactionsByDate = (
  transactions: TransformedTransaction[],
): SectionedTransaction[] => {
  const grouped: {[key: string]: TransformedTransaction[]} = {};

  transactions.forEach(tx => {
    const txDate = new Date(tx.timestamp);

    let sectionTitle: string;
    if (isToday(txDate)) {
      sectionTitle = 'Today';
    } else if (isYesterday(txDate)) {
      sectionTitle = 'Yesterday';
    } else {
      sectionTitle = format(txDate, 'MMMM d, yyyy');
    }

    if (!grouped[sectionTitle]) {
      grouped[sectionTitle] = [];
    }
    grouped[sectionTitle].push(tx);
  });

  return Object.keys(grouped).map(title => ({
    title,
    data: grouped[title].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    ),
  }));
};
