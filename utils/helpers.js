const dayjs = require('dayjs');

const getCurrentMonth = () => dayjs().format('YYYY-MM');
const getPreviousMonth = (months = 1) => dayjs().subtract(months, 'month').format('YYYY-MM');
const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
};

const generateMonthsArray = (count = 12) => {
  const months = [];
  for (let i = count - 1; i >= 0; i--) {
    months.push(dayjs().subtract(i, 'month').format('YYYY-MM'));
  }
  return months;
};

module.exports = {
  getCurrentMonth,
  getPreviousMonth,
  formatCurrency,
  generateMonthsArray,
};
