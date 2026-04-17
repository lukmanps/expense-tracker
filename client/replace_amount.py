import os

dir_path = '/Users/lukman/My Folder/expense-tracker/client/src/pages'
files_to_check = ['DashboardPage.jsx', 'TransactionsPage.jsx', 'BillsPage.jsx', 'IncomePage.jsx', 'ExpensesPage.jsx', 'StatsPage.jsx']

for filename in files_to_check:
    filepath = os.path.join(dir_path, filename)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Specifically for our standard currency representations
        content = content.replace('>${', '>₹{')
        content = content.replace('-${', '-₹{')
        content = content.replace('+${', '+₹{')
        content = content.replace('\"$\"', '\"₹\"')
        # Dashboard specific:
        content = content.replace('saved ${', 'saved ₹{')
        # BillsPage specific:
        content = content.replace(' for ${confirmBill.amount', ' for ₹{confirmBill.amount')
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {filename}')
        
# For AmountDisplay
amount_display_path = '/Users/lukman/My Folder/expense-tracker/client/src/components/ui/AmountDisplay.jsx'
with open(amount_display_path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('${formatted}', '₹{formatted}')
with open(amount_display_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated AmountDisplay.jsx')
