let entries = JSON.parse(localStorage.getItem('entries')) || [];
let budgets = JSON.parse(localStorage.getItem('budgets')) || {};
let redundancy = parseFloat(localStorage.getItem('redundancy')) || 0;
let redundancyLimit = parseFloat(localStorage.getItem('redundancyLimit')) || 300;
let savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
let savedBudgetItems = JSON.parse(localStorage.getItem('savedBudgetItems')) || [];

// 页面加载时更新所有显示信息
document.addEventListener("DOMContentLoaded", () => {
    updateEntryList();
    updateBudgetList();
    updateRedundancyAmount();
    updateItemTags();
    updateBudgetTags();
    document.getElementById("redundancy-limit-display").textContent = redundancyLimit;
});

function addEntry() {
    let item = document.getElementById("item").value;
    let amount = parseFloat(document.getElementById("amount").value);
    let note = document.getElementById("note").value;

    if (item && !isNaN(amount)) {
        // 保存账目项目为标签
        if (!savedItems.includes(item)) {
            savedItems.push(item);
            saveData('savedItems', savedItems);
        }
        updateItemTags();

        // 添加每笔账目信息
        entries.push({ item: item, amount: amount, note: note });
        saveData('entries', entries);

        // 更新冗余库状态
        checkBudgetAndUpdateRedundancy(item);

        // 更新账目信息列表
        updateEntryList();

        // 更新冗余库显示
        updateRedundancyAmount();

        // 清空输入框
        document.getElementById("item").value = '';
        document.getElementById("amount").value = '';
        document.getElementById("note").value = '';
    } else {
        alert("请输入有效的账目和金额");
    }
}

function setBudget() {
    let budgetItem = document.getElementById("budget-item").value;
    let budgetLimit = parseFloat(document.getElementById("budget-limit").value);

    if (budgetItem && !isNaN(budgetLimit)) {
        if (budgets[budgetItem] === undefined) {
            budgets[budgetItem] = budgetLimit;
            saveData('budgets', budgets);

            // 保存预算项目为标签
            if (!savedBudgetItems.includes(budgetItem)) {
                savedBudgetItems.push(budgetItem);
                saveData('savedBudgetItems', savedBudgetItems);
            }
            updateBudgetTags();

            // 更新预算列表
            updateBudgetList();
            alert(`已为 ${budgetItem} 设定预算 ¥${budgetLimit}`);
        } else {
            alert("本月预算已设定，无法修改！");
        }

        // 清空输入框
        document.getElementById("budget-item").value = '';
        document.getElementById("budget-limit").value = '';
    } else {
        alert("请输入有效的预算项目和额度");
    }
}

function setRedundancyLimit() {
    let newLimit = parseFloat(document.getElementById("redundancy-limit").value);
    if (!isNaN(newLimit) && newLimit > 0) {
        redundancyLimit = newLimit;
        document.getElementById("redundancy-limit-display").textContent = redundancyLimit;
        saveData('redundancyLimit', redundancyLimit);
        alert(`冗余库额度已设置为 ¥${redundancyLimit}`);
    } else {
        alert("请输入有效的冗余库额度");
    }
}

function setUserName() {
    let userName = document.getElementById("user-name").value;
    if (userName.trim() !== "") {
        document.getElementById("header-title").textContent = `${userName}的记账系统`;
        saveData('userName', userName);
    } else {
        alert("请输入有效的名字");
    }
}

function setBackgroundImage() {
    let backgroundInput = document.getElementById("background-upload");
    let file = backgroundInput.files[0];

    if (file) {
        let reader = new FileReader();
        reader.onload = function(e) {
            document.body.style.background = `url('${e.target.result}') no-repeat center center fixed`;
            document.body.style.backgroundSize = 'cover';
            saveData('backgroundImage', e.target.result);
        };
        reader.readAsDataURL(file);
    } else {
        alert("请上传有效的图片文件");
    }
}

function checkBudgetAndUpdateRedundancy(item) {
    // 计算项目的累计金额
    let totalSpent = entries.filter(entry => entry.item === item)
                            .reduce((sum, entry) => sum + entry.amount, 0);

    if (budgets[item] !== undefined) {
        let budgetLimit = budgets[item];
        if (totalSpent > budgetLimit) {
            let excess = totalSpent - budgetLimit;
            if (redundancy + excess <= redundancyLimit) {
                redundancy += excess;
                saveData('redundancy', redundancy);
                alert(`项目 "${item}" 超出预算，超出部分 ¥${excess} 已记录到冗余库`);
            } else {
                alert("冗余库额度不足，无法记录所有超出部分！");
            }
        }
    }
}

function updateEntryList() {
    let entryList = document.getElementById("entry-list");
    entryList.innerHTML = '';

    entries.forEach((entry) => {
        let listItem = document.createElement('li');
        listItem.textContent = `${entry.item}: ¥${entry.amount} （备注: ${entry.note}）`;
        entryList.appendChild(listItem);
    });
}

function updateBudgetList() {
    let budgetList = document.getElementById("budget-list");
    budgetList.innerHTML = '';

    for (let item in budgets) {
        let listItem = document.createElement('li');
        listItem.textContent = `${item}: ¥${budgets[item]}`;
        budgetList.appendChild(listItem);
    }
}

function updateRedundancyAmount() {
    let redundancyAmount = document.getElementById("redundancy-amount");
    redundancyAmount.textContent = redundancy;
}

function sortEntriesByTotal() {
    let totals = {};

    // 计算每个账目项目的总金额
    entries.forEach((entry) => {
        if (totals[entry.item]) {
            totals[entry.item] += entry.amount;
        } else {
            totals[entry.item] = entry.amount;
        }
    });

    // 将账目项目按总金额排序
    let sortedEntries = Object.entries(totals).sort((a, b) => b[1] - a[1]);

    let sortedEntryList = document.getElementById("sorted-entry-list");
    sortedEntryList.innerHTML = '';

    sortedEntries.forEach(([item, total]) => {
        let listItem = document.createElement('li');
        listItem.textContent = `${item}: 总金额 ¥${total}`;
        sortedEntryList.appendChild(listItem);
    });
}

function updateItemTags() {
    let itemTags = document.getElementById("item-tags");
    itemTags.innerHTML = '';

    savedItems.forEach((item, index) => {
        let tagItem = document.createElement('div');
        tagItem.className = 'tag-item';
        tagItem.textContent = item;

        let deleteButton = document.createElement('span');
        deleteButton.textContent = ' ×';
        deleteButton.className = 'delete-tag';
        deleteButton.onclick = () => {
            savedItems.splice(index, 1);
            saveData('savedItems', savedItems);
            updateItemTags();
        };

        tagItem.appendChild(deleteButton);
        tagItem.onclick = () => {
            document.getElementById("item").value = item;
        };

        itemTags.appendChild(tagItem);
    });
}

function updateBudgetTags() {
    let budgetTags = document.getElementById("budget-tags");
    budgetTags.innerHTML = '';

    savedBudgetItems.forEach((item, index) => {
        let tagItem = document.createElement('div');
        tagItem.className = 'tag-item';
        tagItem.textContent = item;

        let deleteButton = document.createElement('span');
        deleteButton.textContent = ' ×';
        deleteButton.className = 'delete-tag';
        deleteButton.onclick = () => {
            savedBudgetItems.splice(index, 1);
            saveData('savedBudgetItems', savedBudgetItems);
            updateBudgetTags();
        };

        tagItem.appendChild(deleteButton);
        tagItem.onclick = () => {
            document.getElementById("budget-item").value = item;
        };

        budgetTags.appendChild(tagItem);
    });
}

function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function showItemTags() {
    document.getElementById("item-tags").style.display = 'block';
}

function hideItemTags() {
    setTimeout(() => {
        document.getElementById("item-tags").style.display = 'none';
    }, 200);
}

function showBudgetTags() {
    document.getElementById("budget-tags").style.display = 'block';
}

function hideBudgetTags() {
    setTimeout(() => {
        document.getElementById("budget-tags").style.display = 'none';
    }, 200);
}

// 页面加载时恢复用户名和背景
document.addEventListener("DOMContentLoaded", () => {
    const userName = localStorage.getItem('userName');
    if (userName) {
        document.getElementById("header-title").textContent = `${JSON.parse(userName)}的记账系统`;
    }

    const backgroundImage = localStorage.getItem('backgroundImage');
    if (backgroundImage) {
        document.body.style.background = `url('${JSON.parse(backgroundImage)}') no-repeat center center fixed`;
        document.body.style.backgroundSize = 'cover';
    }
});
