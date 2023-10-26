// Vars
const setting_modal_button = document.getElementById('setting');
const setting_button_close = document.getElementById('setting_button_close');
const setting_modal = document.getElementById('setting_modal');
const early_pay_rate = document.getElementById('early_pay_rate');
const interest_rate = document.getElementById('interest_rate');
const overlay = document.getElementById('overlay');
const setting_button_save = document.getElementById('setting_button_save');
const amount = document.getElementById('amount');
const period = document.getElementById('period');
const last_paid = document.getElementById('last_paid');
const calculate = document.getElementById('calculate');
const currnet_month_paid = document.getElementById('currnet_month_paid');
const result = document.getElementById('result');

// Load Config file
async function config() {
    const response = await fetch("./config.json");
    const configs = await response.json();
    return configs;
}

// Save config to local storage
async function loadConfig() {
    const configs = await config();
    for (let key of Object.keys(configs)) {
        if (localStorage.getItem(key) == undefined || localStorage.getItem(key) == null) {
            localStorage.setItem(key, configs[key]);
        }
    }

    console.log('Loaded Successfully!');
}

// populate last paid select
function populatePeriodSelect(selectElem) {
    let selected = selectElem.options[selectElem.options.selectedIndex].value;
    last_paid.innerHTML = '';
    for (let i = (selected / 2); i <= selected; i++) {
        let opt = new Option(i, i);
        last_paid.appendChild(opt);
    }
}

// Calculate Total interest rate
function getTotalInterestRate(rate, period) {
    let multiplier = parseFloat(period / 12.0);
    return parseFloat((rate * multiplier) / 100);
}

// Calculate installments
function calculateInstallment(total, period) {
    period = parseInt(period);
    let singleInstallment = total / period;
    let installments = [];

    // Populate installment
    for (let i = 0; i < period; i++) {
        installments.push(singleInstallment);
    }

    // Round Installments
    let last_installment = installments[installments.length - 1];
    for (let i = 0; i < installments.length - 1; i++) {
        if (installments[i] % 5 != 0) {
            let temp = installments[i];
            let remainder = temp % 5;
            last_installment += remainder;
            temp -= remainder;
            temp += 5;
            last_installment -= 5;
            installments[i] = temp;
        }
    }

    installments[installments.length - 1] = parseInt(last_installment);

    return installments;
}

// Render Result
function renderResult(amount, installment, remains) {
    let html = `
        <table>
            <thead>
                <th>مبلغ القرض</th>
                <th>قيمة القسط</th>
                <th>المبلغ المستحق</th>
            </thead>
            <tbody>
                <tr>
                    <td>${amount}</td>
                    <td>${installment}</td>
                    <td id="must">${remains}</td>
                </tr>
            </tbody>
        </table>
    `;

    result.innerHTML = html;
}

// Stater Funcs
loadConfig();
populatePeriodSelect(period);

// Save new Settings
setting_button_save.addEventListener('click', function () {
    if (setting_modal !== undefined) {
        setting_modal.style.display = 'none';
        overlay.style.display = 'none';
    }

    localStorage.setItem('interest_rate', interest_rate.value);
    localStorage.setItem('early_pay_rate', early_pay_rate.value);

    console.log("Saved Successfully");
});

// Show setting Modal and load data
setting_modal_button.addEventListener('click', function () {
    if (setting_modal !== undefined) {
        setting_modal.style.display = 'block';
        overlay.style.display = 'block';
    }

    int_rate = localStorage.getItem('interest_rate');
    if (int_rate !== null) {
        interest_rate.value = int_rate;
    }

    early_rate = localStorage.getItem('early_pay_rate');
    if (early_rate !== null) {
        early_pay_rate.value = early_rate;
    }
});

// Close  Setting Modal
setting_button_close.addEventListener('click', function () {
    if (setting_modal !== undefined) {
        setting_modal.style.display = 'none';
        overlay.style.display = 'none';
    }
});

// populate last paid select according to period
period.addEventListener('change', function () {
    populatePeriodSelect(this);
});

calculate.addEventListener('click', function () {
    let amount_val = amount.value;

    // validate amount
    if (amount_val == null || amount_val == undefined || amount_val <= 0 || amount_val >= 1000000) {
        amount.classList.add('invalid');
        return;
    } else {
        amount.classList.remove('invalid');
    }

    // validate period
    let period_val = period.options[period.options.selectedIndex].value;
    if (period_val == null || period_val == undefined || period_val <= 0 || period_val > 36) {
        period.classList.add('invalid');
    } else {
        period.classList.remove('invalid');
    }

    // validate last_paid
    let last_paid_val = last_paid.options[last_paid.options.selectedIndex].value
    last_paid_val = parseInt(last_paid_val);
    period_val = parseInt(period_val);

    if (last_paid_val == null || last_paid_val == undefined || last_paid_val < (period_val / 2) || last_paid_val > period_val) {
        last_paid.classList.add('invalid');
    } else {
        last_paid.classList.remove('invalid');
    }

    // Calculate
    let interest_rate_val = localStorage.getItem('interest_rate');
    let early_pay_rate_val = localStorage.getItem('early_pay_rate');

    let total_rate = getTotalInterestRate(interest_rate_val, period_val);

    let total_amount = parseFloat(amount_val) + parseFloat(amount.value) * total_rate;
    let installments = calculateInstallment(total_amount, period_val);

    let loop = currnet_month_paid.checked == true ? last_paid_val : last_paid_val-1;

    let remains = 0;
    for (let i = loop; i < installments.length; i++) {
        remains += installments[i];
    }

    let remains_without_interest = remains * getTotalInterestRate(interest_rate_val, period_val);
    remains = remains - remains_without_interest;

    let early_pay_amount = remains * (early_pay_rate_val / 100);
    remains = remains + early_pay_amount;

    remains = currnet_month_paid.checked == true ? remains : remains + installments[loop];

    renderResult(amount.value, installments[loop], Math.round(remains));
});

