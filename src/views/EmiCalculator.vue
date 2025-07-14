<template>
	<div class="card">
		<div class="title">
			<h1>The Real EMI Calculator</h1>
		</div>
		<form :name="emiInputFormName" class="input-form">
			<div class="input-group">
				<label for="baseAmount">Base Amount: *</label>
				<input
					id="baseAmount"
					name="baseAmount"
					title="The base amount of the item without any card/EMI/No-Cost-EMI discount"
					v-model.number="baseAmount"
					type="number"
					min="0.01"
					step="0.01"
					required
					v-on:input="calculateEMI"
				/>
			</div>
			<div class="input-group">
				<label for="discountAmount">Offer Discount:</label>
				<input
					id="discountAmount"
					name="discountAmount"
					title="The discount amount for the item for using specific card or EMI on those card (this is not No-Cost-EMI discount)"
					v-model.number="discountAmount"
					type="number"
					min="0.00"
					step="0.01"
					v-on:input="calculateEMI"
				/>
			</div>
			<div class="input-group">
				<label for="ncEmiDiscountAmount">No Cost EMI Discount:</label>
				<input
					id="ncEmiDiscountAmount"
					name="ncEmiDiscountAmount"
					title="The interest discount amount provided for No-Cost-EMI payment option)"
					v-model.number="ncEmiDiscountAmount"
					type="number"
					min="0.00"
					step="0.01"
					v-on:input="calculateEMI"
				/>
			</div>
			<div class="input-group">
				<label for="tenure">Tenure (months): *</label>
				<input
					id="tenure"
					name="tenure"
					title="Number of month for EMI"
					v-model.number="tenure"
					type="number"
					min="1"
					required
					v-on:input="calculateEMI"
				/>
			</div>
			<div class="input-group">
				<label for="interestRate">Interest Rate (%): *</label>
				<input
					id="interestRate"
					name="interestRate"
					title="Interest Rate of the EMI"
					v-model.number="interestRate"
					type="number"
					min="0.00"
					step="0.01"
					required
					v-on:input="calculateEMI"
				/>
			</div>
			<div class="input-group">
				<label for="processingFee">Processing Fee (%/₹):</label>
				<input
					id="processingFee"
					name="processingFee"
					title="Processing fee for EMI conversion, if value is less than 20, then it will be considered in % of payment amount"
					v-model.number="processingFee"
					type="number"
					min="0.00"
					step="0.01"
					placeholder="% or Amount"
					v-on:input="calculateEMI"
				/>
			</div>
		</form>
		<div class="button-container">
			<!-- <button @click="calculateEMI" :disabled="!isFormValid">Calculate EMI</button> -->
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
						<th>GST on Interest ({{ GST * 100 }}%)</th>
						<th>Processing Fee + GST ({{ GST * 100 }}%)</th>
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
						<td>
							{{ formatCurrency(row.processingFeeWithGst) }}
							<div v-if="row.month === 1" style="white-space: nowrap">
								({{ formatCurrency(row.processingFee) }} + {{ formatCurrency(row.processingFeeGst) }})
							</div>
						</td>
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
							<strong>{{ formatCurrency(totals.principalPlusInterest) }}</strong>
						</td>
						<td>
							<strong>{{ formatCurrency(totals.gstOnInterest) }}</strong>
						</td>
						<td>
							<strong>{{ formatCurrency(totals.processingFeeWithGst) }}</strong>
						</td>
						<td
							class="total-emi-payable"
							:class="{ 'more-than-principal': truncate(totals.emiPayable) > truncate(totals.principal) }"
						>
							<strong>{{ formatCurrency(totals.emiPayable) }}</strong>
						</td>
						<td>-</td>
					</tr>
				</tfoot>
			</table>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, type LocationQueryRaw, type LocationQueryValueRaw } from 'vue-router';

interface MonthlyRow {
	month: number;
	principal: number;
	interest: number;
	principalPlusInterest: number;
	gstOnInterest: number;
	processingFee: number;
	processingFeeGst: number;
	processingFeeWithGst: number;
	emiPayable: number;
	balance: number;
}

const emiInputFormName = 'emi-inputs';

const router = useRouter();

const GST = 0.18;
const baseAmount = defineModel<number>('baseAmount', { default: 10000.0 });
const discountAmount = defineModel<number>('discountAmount', { default: 0.0 });
const ncEmiDiscountAmount = defineModel<number>('ncEmiDiscountAmount', { default: 0.0 });
const tenure = defineModel<number>('tenure', { default: 3 });
const interestRate = defineModel<number>('interestRate', { default: 16.0 });
const processingFee = defineModel<number>('processingFee', { default: 199.0 });
const amortizationSchedule = ref<Array<MonthlyRow>>([]);

const isFormValid = computed(() => {
	return baseAmount.value && baseAmount.value > 0 && tenure.value && tenure.value > 0;
});

onMounted(() => {
	console.log('Route:', router.currentRoute.value);
	Object.entries(router.currentRoute.value.query || {}).forEach(keyValue => {
		const key = keyValue[0];
		const value = keyValue[1] as string;
		const inputElem = document.forms.namedItem(emiInputFormName)?.elements.namedItem(key) as HTMLInputElement;
		if (inputElem) {
			inputElem.value = value;
			inputElem.dispatchEvent(new InputEvent('input', { data: value, bubbles: false, cancelable: true }));
		}
	});
});

const calculateEMI = (event: Event = new Event('')) => {
	if (!isFormValid.value) return;

	baseAmount.value = baseAmount.value > 0 ? baseAmount.value : 0;
	discountAmount.value = discountAmount.value > 0 ? discountAmount.value : 0;
	ncEmiDiscountAmount.value = ncEmiDiscountAmount.value > 0 ? ncEmiDiscountAmount.value : 0;
	tenure.value = tenure.value > 0 ? tenure.value : 0;
	interestRate.value = interestRate.value > 0 ? interestRate.value : 0;
	processingFee.value = processingFee.value > 0 ? processingFee.value : 0;

	const principal = baseAmount.value - discountAmount.value - ncEmiDiscountAmount.value;
	const monthlyRate = interestRate.value / 12 / 100;
	const monthlyRateForTenure = Math.pow(1 + monthlyRate, tenure.value);
	const emi =
		monthlyRate > 0
			? (principal * monthlyRate * monthlyRateForTenure) / (monthlyRateForTenure - 1)
			: principal / tenure.value;
	const processingFeeAmount = truncate(
		processingFee.value > 20 ? processingFee.value : (principal * processingFee.value) / 100,
	);
	const processingFeeGst = truncate(processingFeeAmount * GST);

	let balance = principal;
	const schedule: MonthlyRow[] = [];

	// Add month 0 to show initial balance
	schedule.push({
		month: 0,
		principal: 0,
		interest: 0,
		principalPlusInterest: 0,
		gstOnInterest: 0,
		processingFee: 0,
		processingFeeGst: 0,
		processingFeeWithGst: 0,
		emiPayable: 0,
		balance: principal,
	});

	for (let month = 1; month <= tenure.value; month++) {
		const interest = balance * monthlyRate;
		const gstOnInterest = interest * GST;
		const principalPaid = emi - interest;
		let processingFeeWithGst = 0;

		if (month === 1) {
			processingFeeWithGst = processingFeeAmount + processingFeeGst;
		}

		balance -= principalPaid;

		schedule.push({
			month,
			principal: principalPaid,
			interest,
			principalPlusInterest: principalPaid + interest,
			gstOnInterest,
			processingFee: month === 1 ? processingFeeAmount : 0,
			processingFeeGst: month === 1 ? processingFeeGst : 0,
			processingFeeWithGst,
			emiPayable: emi + gstOnInterest + processingFeeWithGst,
			balance: Math.max(balance, 0),
		});

		if (balance <= 0) break;
	}

	amortizationSchedule.value = schedule;

	if (event?.target && event?.isTrusted) {
		const emiInputsForm = document.forms.namedItem(emiInputFormName);
		if (emiInputsForm) {
			updateQueryParams(new FormData(emiInputsForm));
		}
	}
};
calculateEMI();

const totals = computed(() => {
	return amortizationSchedule.value.reduce(
		(acc, row) => {
			if (row.month !== 0) {
				// Exclude month 0 from totals
				acc.principal += row.principal;
				acc.interest += row.interest;
				acc.principalPlusInterest += row.principalPlusInterest;
				acc.gstOnInterest += row.gstOnInterest;
				acc.processingFeeWithGst += row.processingFeeWithGst;
				acc.emiPayable += row.emiPayable;
			}
			return acc;
		},
		{
			principal: 0,
			interest: 0,
			principalPlusInterest: 0,
			gstOnInterest: 0,
			processingFeeWithGst: 0,
			emiPayable: 0,
		},
	);
});

const formatCurrency = (value: number) => {
	return new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: 'INR',
	}).format(value);
};

const resetForm = () => {
	baseAmount.value = 10000;
	discountAmount.value = 0;
	ncEmiDiscountAmount.value = 0;
	tenure.value = 3;
	interestRate.value = 16;
	processingFee.value = 199;
	amortizationSchedule.value = [];
	calculateEMI();
	updateQueryParams();
};

function updateQueryParams(formData: FormData | undefined = undefined) {
	const query: LocationQueryRaw = {};
	formData?.forEach((val, key) => {
		query[key] = val as LocationQueryValueRaw;
	});
	router.replace({ query });
}

function truncate(number: number) {
	if (Number.isNaN(number)) return 0.0;
	const valueString = number.toString();
	if (valueString.indexOf('.') + 3 > valueString.length) {
		return Number(valueString.slice(0, valueString.indexOf('.') + 3));
	}
	return number;
}
</script>

<style scoped>

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

.button-container .reset-button:hover {
	background-color: #f4511e; /* A slightly darker orange for hover effect */
}

.table-container {
	overflow-x: auto;
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

</style>
