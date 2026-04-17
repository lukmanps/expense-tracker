import os
import re

dir_path = '/Users/lukman/My Folder/expense-tracker/client/src'
pattern = re.compile(r'\$(?!\{)')

for root, dirs, files in os.walk(dir_path):
    for file in files:
        if file.endswith('.js') or file.endswith('.jsx'):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = pattern.sub('₹', content)
            
            if new_content != content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Updated {file_path}')
