<template>
  <div id="app">
    <h1>The Real EMI Calculator</h1>
    <div class="card">
      <div class="input-form">
        <div class="input-group">
          <label for="baseAmount">Base Amount: *</label>
          <input
            id="baseAmount"
            v-model.number="baseAmount"
            type="number"
            required
          />
        </div>
        <div class="input-group">
          <label for="discountAmount">Offer Discount:</label>
          <input
            id="discountAmount"
            v-model.number="discountAmount"
            type="number"
          />
        </div>
        <div class="input-group">
          <label for="ncEmiDiscountAmount">No Cost EMI Discount:</label>
          <input
            id="ncEmiDiscountAmount"
            v-model.number="ncEmiDiscountAmount"
            type="number"
          />
        </div>
        <div class="input-group">
          <label for="tenure">Tenure (months): *</label>
          <input id="tenure" v-model.number="tenure" type="number" required />
        </div>
        <div class="input-group">
          <label for="interestRate">Interest Rate (%): *</label>
          <input
            id="interestRate"
            v-model.number="interestRate"
            type="number"
            step="0.01"
            required
          />
        </div>
        <div class="input-group">
          <label for="processingFee">Processing Fee:</label>
          <input
            id="processingFee"
            v-model.number="processingFee"
            type="number"
          />
        </div>
      </div>
      <div class="button-container">
        <button @click="calculateEMI" :disabled="!isFormValid">
          Calculate EMI
        </button>
        <button @click="resetForm" class="reset-button">Reset</button>
      </div>
    </div>
    <div v-if="amortizationSchedule.length > 0" class="results card">
      <h2>Amortization Schedule</h2>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Principal Amount</th>
              <th>Interest</th>
              <th>Principal + Interest</th>
              <th>GST on Interest (18%)</th>
              <th>Processing Fee + GST (18%)</th>
              <th>EMI Payable</th>
              <th>Principal Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in amortizationSchedule" :key="index">
              <td>{{ row.month }}</td>
              <td>{{ formatCurrency(row.principal) }}</td>
              <td>{{ formatCurrency(row.interest) }}</td>
              <td>{{ formatCurrency(row.principalPlusInterest) }}</td>
              <td>{{ formatCurrency(row.gstOnInterest) }}</td>
              <td>{{ formatCurrency(row.processingFeeWithGst) }}</td>
              <td>{{ formatCurrency(row.emiPayable) }}</td>
              <td>{{ formatCurrency(row.balance) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td><strong>Total</strong></td>
              <td>
                <strong>{{ formatCurrency(totals.principal) }}</strong>
              </td>
              <td>
                <strong>{{ formatCurrency(totals.interest) }}</strong>
              </td>
              <td>
                <strong>{{
                  formatCurrency(totals.principalPlusInterest)
                }}</strong>
              </td>
              <td>
                <strong>{{ formatCurrency(totals.gstOnInterest) }}</strong>
              </td>
              <td>
                <strong>{{
                  formatCurrency(totals.processingFeeWithGst)
                }}</strong>
              </td>
              <td class="total-emi-payable">
                <strong>{{ formatCurrency(totals.emiPayable) }}</strong>
              </td>
              <td>-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const GST = 0.18
const baseAmount = ref<number>()
const discountAmount = ref<number>(0)
const ncEmiDiscountAmount = ref<number>(0)
const tenure = ref<number>()
const interestRate = ref<number>()
const processingFee = ref<number>(0)
const amortizationSchedule = ref<Array<unknown>>([])

const isFormValid = computed(() => {
  return baseAmount.value && tenure.value && interestRate.value
})

const calculateEMI = () => {
  if (!isFormValid.value) return

  const principal =
    baseAmount.value! -
    (discountAmount.value || 0) -
    (ncEmiDiscountAmount.value || 0)
  const monthlyRate = interestRate.value! / 12 / 100
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure.value!)) /
    (Math.pow(1 + monthlyRate, tenure.value!) - 1)

  let balance = principal
  const schedule = []

  // Add month 0 to show initial balance
  schedule.push({
    month: 0,
    principal: 0,
    interest: 0,
    principalPlusInterest: 0,
    gstOnInterest: 0,
    processingFeeWithGst: 0,
    emiPayable: 0,
    balance: principal,
  })

  for (let month = 1; month <= tenure.value!; month++) {
    const interest = balance * monthlyRate
    const gstOnInterest = interest * GST
    const principalPaid = emi - interest
    let processingFeeWithGst = 0

    if (month === 1) {
      processingFeeWithGst =
        (processingFee.value || 0) + (processingFee.value || 0) * GST
    }

    balance -= principalPaid

    schedule.push({
      month,
      principal: principalPaid,
      interest,
      principalPlusInterest: principalPaid + interest,
      gstOnInterest,
      processingFeeWithGst,
      emiPayable: emi + gstOnInterest + processingFeeWithGst,
      balance: Math.max(balance, 0),
    })

    if (balance <= 0) break
  }

  amortizationSchedule.value = schedule
}

const totals = computed(() => {
  return amortizationSchedule.value.reduce(
    (acc, row) => {
      if (row.month !== 0) {
        // Exclude month 0 from totals
        acc.principal += row.principal
        acc.interest += row.interest
        acc.principalPlusInterest += row.principalPlusInterest
        acc.gstOnInterest += row.gstOnInterest
        acc.processingFeeWithGst += row.processingFeeWithGst
        acc.emiPayable += row.emiPayable
      }
      return acc
    },
    {
      principal: 0,
      interest: 0,
      principalPlusInterest: 0,
      gstOnInterest: 0,
      processingFeeWithGst: 0,
      emiPayable: 0,
    },
  )
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(value)
}

const resetForm = () => {
  baseAmount.value = undefined
  discountAmount.value = 0
  ncEmiDiscountAmount.value = 0
  tenure.value = undefined
  interestRate.value = undefined
  processingFee.value = 0
  amortizationSchedule.value = []
}
</script>

<style scoped>
:root {
  --primary-color: rgba(52, 152, 219, 0.8);
  --secondary-color: rgba(44, 62, 80, 0.8);
  --background-color: rgba(255, 255, 255, 0.2);
  --card-background: rgba(255, 255, 255, 0.1);
  --text-color: #ecf0f1;
}

body {
  background-color: var(--background-color);
  color: var(--text-color);
  line-height: 1.6;
  backdrop-filter: blur(40px);
}

#app {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

h1,
h2 {
  color: var(--text-color);
  text-align: center;
}

.card {
  background-color: var(--card-background);
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
  backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  background-color: rgba(255, 255, 255, 0.1);
}

.input-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
}

label {
  margin-bottom: 5px;
  font-weight: bold;
}

input {
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 16px;
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--text-color);
}

.button-container {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}

.button-container button {
  width: 200px;
  background-color: #00bcd4; /* A cool cyan color */
  color: #ffffff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.button-container .reset-button {
  background-color: #ff5722; /* A contrasting orange color */
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
}

button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.button-container .reset-button:hover {
  background-color: #f4511e; /* A slightly darker orange for hover effect */
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 20px;
}

th,
td {
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px;
  text-align: right;
}

th {
  background-color: var(--primary-color);
  color: var(--text-color);
  font-weight: bold;
}

tfoot td {
  font-weight: bold;
  color: #ffd700; /* Gold color for the total row text */
}

tfoot td.total-emi-payable {
  color: #ff4500; /* Orange-red color for the total EMI payable */
}

th:first-child,
td:first-child {
  border-left: 1px solid rgba(255, 255, 255, 0.2);
}

th:last-child,
td:last-child {
  border-right: 1px solid rgba(255, 255, 255, 0.2);
}

thead tr:first-child th {
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

thead tr:first-child th:first-child {
  border-top-left-radius: 8px;
}

thead tr:first-child th:last-child {
  border-top-right-radius: 8px;
}

tbody tr:last-child td:first-child {
  border-bottom-left-radius: 8px;
}

tbody tr:last-child td:last-child {
  border-bottom-right-radius: 8px;
}

.explanation {
  margin-top: 20px;
}

.explanation p {
  margin: 10px 0;
}

label[for='baseAmount']::after,
label[for='tenure']::after,
label[for='interestRate']::after {
  content: ' *';
  color: #ff4500;
}

input:required {
  border-color: #ff4500;
}

input:required:valid {
  border-color: #4caf50;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
