import os

dir_path = '/Users/lukman/My Folder/expense-tracker/client/src/pages'
files_to_check = ['DashboardPage.jsx', 'TransactionsPage.jsx', 'BillsPage.jsx', 'IncomePage.jsx', 'ExpensesPage.jsx', 'StatsPage.jsx', 'AmountDisplay.jsx', 'AddBillPage.jsx', 'AddIncomePage.jsx', 'AddExpensePage.jsx', 'LoginPage.jsx', 'RegisterPage.jsx']

for root, dirs, files in os.walk(dir_path):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            content = content.replace('>$', '>₹')
            content = content.replace('-$', '-₹')
            content = content.replace('+$', '+₹')
            content = content.replace('>$', '>₹')
            content = content.replace(' "$"', ' "₹"')
            content = content.replace('saved ${', 'saved ₹{')
            content = content.replace('${(summary?.totalIncome', '₹{(summary?.totalIncome')
            content = content.replace('${(summary?.totalExpense', '₹{(summary?.totalExpense')
            content = content.replace('${payload[0].value?.toLocaleString()}', '₹{payload[0].value?.toLocaleString()}')
            content = content.replace('${expense.amount.toLocaleString', '₹{expense.amount.toLocaleString')
            content = content.replace('${cat.amount.toLocaleString', '₹{cat.amount.toLocaleString')
            content = content.replace('for ${confirmBill.amount', 'for ₹{confirmBill.amount')
            content = content.replace('>\n      ${formatted}', '>\n      ₹{formatted}')
            content = content.replace(' {item.amount > 0 ? \'+\' : \'-\'}$', ' {item.amount > 0 ? \'+\' : \'-\'}₹')
            content = content.replace(' {item.amount >= 0 ? \'+\' : \'-\'}$', ' {item.amount >= 0 ? \'+\' : \'-\'}₹')
            content = content.replace('{tab === \'to_receive\' ? \'+\' : \'-\'}$', '{tab === \'to_receive\' ? \'+\' : \'-\'}₹')
            content = content.replace(' className="mr-1 text-text-muted">$<', ' className="mr-1 text-text-muted">₹<')

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

# Special cases
try:
    amountStr = '/Users/lukman/My Folder/expense-tracker/client/src/components/ui/AmountDisplay.jsx'
    with open(amountStr, 'r') as f:
        content = f.read()
    content = content.replace('>${formatted}<', '>₹{formatted}<')
    with open(amountStr, 'w') as f:
        f.write(content)
except Exception:
    pass

