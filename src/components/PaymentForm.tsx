/**
 * Payment Form Component
 * Handles provider selection and payment details collection
 */

import clsx from "clsx";
import React, { useCallback, useEffect, useState } from "react";
import "../styles/PaymentForm.css";
import {
	PaymentFormProps,
	PaymentMethod,
	PaymentProvider,
	PaymentProviderInfo,
	PaymentRequest,
} from "../types";
import { LoadingSpinner } from "./LoadingSpinner";

interface FormData {
	provider: PaymentProvider | "";
	paymentMethod: PaymentMethod | "";
	customerName: string;
	customerEmail: string;
	customerPhone: string;
	description: string;
}

export const PaymentForm: React.FC<
	PaymentFormProps & {
		initialData: Omit<PaymentRequest, "provider" | "paymentMethod">;
		showProviderLogos?: boolean;
	}
> = ({
	onSubmit,
	providers,
	config,
	theme,
	loading = false,
	error,
	customization,
	initialData,
	showProviderLogos = true,
}) => {
	const [formData, setFormData] = useState<FormData>({
		provider: "",
		paymentMethod: "",
		customerName: initialData.customerName || "",
		customerEmail: initialData.customerEmail || "",
		customerPhone: initialData.customerPhone || "",
		description: initialData.description || "",
	});

	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});
	const [selectedProviderInfo, setSelectedProviderInfo] =
		useState<PaymentProviderInfo | null>(null);

	// Update selected provider info when provider changes
	useEffect(() => {
		if (formData.provider) {
			const providerInfo = providers.find(
				(p) => p.code === formData.provider
			);
			setSelectedProviderInfo(providerInfo || null);

			// Auto-select payment method if provider only supports one
			if (providerInfo && providerInfo.supportedMethods.length === 1) {
				setFormData((prev) => ({
					...prev,
					paymentMethod: providerInfo.supportedMethods[0],
				}));
			} else {
				setFormData((prev) => ({ ...prev, paymentMethod: "" }));
			}
		} else {
			setSelectedProviderInfo(null);
		}
	}, [formData.provider, providers]);

	// Handle form field changes
	const handleFieldChange = useCallback(
		(field: keyof FormData, value: string) => {
			setFormData((prev) => ({ ...prev, [field]: value }));

			// Clear validation error for this field
			if (validationErrors[field]) {
				setValidationErrors((prev) => {
					const newErrors = { ...prev };
					delete newErrors[field];
					return newErrors;
				});
			}
		},
		[validationErrors]
	);

	// Validate form data
	const validateForm = useCallback((): boolean => {
		const errors: Record<string, string> = {};

		if (!formData.provider) {
			errors.provider = "Please select a payment provider";
		}

		if (!formData.paymentMethod) {
			errors.paymentMethod = "Please select a payment method";
		}

		if (!formData.customerName.trim()) {
			errors.customerName = "Customer name is required";
		}

		// Provider-specific validation
		if (formData.provider === "MPESA" && !formData.customerPhone) {
			errors.customerPhone =
				"Phone number is required for M-Pesa payments";
		}

		if (
			["PAYPAL", "STRIPE"].includes(formData.provider) &&
			!formData.customerEmail
		) {
			errors.customerEmail = "Email is required for this payment method";
		}

		// Email format validation
		if (formData.customerEmail && !isValidEmail(formData.customerEmail)) {
			errors.customerEmail = "Please enter a valid email address";
		}

		// Phone format validation
		if (formData.customerPhone && !isValidPhone(formData.customerPhone)) {
			errors.customerPhone =
				"Please enter a valid phone number (e.g., +254712345678)";
		}

		// Currency support validation
		if (
			selectedProviderInfo &&
			!selectedProviderInfo.supportedCurrencies.includes(
				initialData.amount.currency
			)
		) {
			errors.provider = `${selectedProviderInfo.name} doesn't support ${initialData.amount.currency} currency`;
		}

		// Amount limits validation
		if (selectedProviderInfo) {
			const amount = initialData.amount.amount;
			if (
				selectedProviderInfo.minimumAmount &&
				amount < selectedProviderInfo.minimumAmount
			) {
				errors.amount = `Minimum amount for ${selectedProviderInfo.name} is ${selectedProviderInfo.minimumAmount}`;
			}
			if (
				selectedProviderInfo.maximumAmount &&
				amount > selectedProviderInfo.maximumAmount
			) {
				errors.amount = `Maximum amount for ${selectedProviderInfo.name} is ${selectedProviderInfo.maximumAmount}`;
			}
		}

		setValidationErrors(errors);
		return Object.keys(errors).length === 0;
	}, [formData, selectedProviderInfo, initialData.amount]);

	// Handle form submission
	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();

			if (!validateForm()) {
				return;
			}

			const paymentRequest: PaymentRequest = {
				...initialData,
				provider: formData.provider as PaymentProvider,
				paymentMethod: formData.paymentMethod as PaymentMethod,
				customerName: formData.customerName,
				customerEmail: formData.customerEmail || undefined,
				customerPhone: formData.customerPhone || undefined,
				description: formData.description || undefined,
			};

			onSubmit(paymentRequest);
		},
		[formData, initialData, validateForm, onSubmit]
	);

	// Helper functions
	const isValidEmail = (email: string): boolean => {
		const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
		return emailRegex.test(email);
	};

	const isValidPhone = (phone: string): boolean => {
		const phoneRegex = /^\+[1-9]\d{1,14}$/;
		return phoneRegex.test(phone);
	};

	const getProviderLogo = (providerCode: string): string => {
		const logos: Record<string, string> = {
			MPESA: "💳",
			PAYPAL: "💙",
			STRIPE: "💜",
			FLUTTERWAVE: "🧡",
			RAZORPAY: "💚",
		};
		return logos[providerCode] || "💰";
	};

	const formatCurrency = (amount: number, currency: string): string => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: currency,
		}).format(amount);
	};

	if (providers.length === 0) {
		return (
			<div className="payment-form__empty">
				<div className="payment-form__empty-icon">💳</div>
				<h3>No Payment Methods Available</h3>
				<p>
					Please contact support to set up payment methods for your
					account.
				</p>
			</div>
		);
	}

	return (
		<form className="payment-form" onSubmit={handleSubmit}>
			{/* Payment Amount Display */}
			<div className="payment-form__amount">
				<h3>Payment Amount</h3>
				<div className="payment-form__amount-display">
					{formatCurrency(
						initialData.amount.amount,
						initialData.amount.currency
					)}
				</div>
				{validationErrors.amount && (
					<div className="payment-form__error">
						{validationErrors.amount}
					</div>
				)}
			</div>

			{/* Provider Selection */}
			<div className="payment-form__section">
				<label className="payment-form__label">
					Choose Payment Provider
					<span className="payment-form__required">*</span>
				</label>
				<div className="payment-form__provider-grid">
					{providers.map((provider) => (
						<button
							key={provider.code}
							type="button"
							className={clsx(
								"payment-form__provider-card",
								formData.provider === provider.code &&
									"payment-form__provider-card--selected"
							)}
							onClick={() =>
								handleFieldChange("provider", provider.code)
							}
							disabled={loading}
						>
							{showProviderLogos && (
								<div className="payment-form__provider-logo">
									{provider.logoUrl ? (
										<img
											src={provider.logoUrl}
											alt={provider.name}
										/>
									) : (
										<span>
											{getProviderLogo(provider.code)}
										</span>
									)}
								</div>
							)}
							<div className="payment-form__provider-info">
								<div className="payment-form__provider-name">
									{provider.name}
								</div>
								<div className="payment-form__provider-desc">
									{provider.description}
								</div>
								{provider.processingTime && (
									<div className="payment-form__provider-time">
										Processing: {provider.processingTime}
									</div>
								)}
							</div>
							{provider.fees && (
								<div className="payment-form__provider-fees">
									{provider.fees.description}
								</div>
							)}
						</button>
					))}
				</div>
				{validationErrors.provider && (
					<div className="payment-form__error">
						{validationErrors.provider}
					</div>
				)}
			</div>

			{/* Payment Method Selection */}
			{selectedProviderInfo &&
				selectedProviderInfo.supportedMethods.length > 1 && (
					<div className="payment-form__section">
						<label className="payment-form__label">
							Payment Method
							<span className="payment-form__required">*</span>
						</label>
						<div className="payment-form__method-grid">
							{selectedProviderInfo.supportedMethods.map(
								(method) => (
									<button
										key={method}
										type="button"
										className={clsx(
											"payment-form__method-card",
											formData.paymentMethod === method &&
												"payment-form__method-card--selected"
										)}
										onClick={() =>
											handleFieldChange(
												"paymentMethod",
												method
											)
										}
										disabled={loading}
									>
										<div className="payment-form__method-name">
											{method
												.replace("_", " ")
												.toLowerCase()
												.replace(/\b\w/g, (l) =>
													l.toUpperCase()
												)}
										</div>
									</button>
								)
							)}
						</div>
						{validationErrors.paymentMethod && (
							<div className="payment-form__error">
								{validationErrors.paymentMethod}
							</div>
						)}
					</div>
				)}

			{/* Customer Information */}
			<div className="payment-form__section">
				<h4>Customer Information</h4>

				<div className="payment-form__field">
					<label className="payment-form__label">
						Full Name
						<span className="payment-form__required">*</span>
					</label>
					<input
						type="text"
						className={clsx(
							"payment-form__input",
							validationErrors.customerName &&
								"payment-form__input--error"
						)}
						value={formData.customerName}
						onChange={(e) =>
							handleFieldChange("customerName", e.target.value)
						}
						placeholder="Enter your full name"
						disabled={loading}
						required
					/>
					{validationErrors.customerName && (
						<div className="payment-form__error">
							{validationErrors.customerName}
						</div>
					)}
				</div>

				<div className="payment-form__field">
					<label className="payment-form__label">
						Email Address
						{(["PAYPAL", "STRIPE"].includes(formData.provider) ||
							customization?.customerFieldsRequired?.email) && (
							<span className="payment-form__required">*</span>
						)}
					</label>
					<input
						type="email"
						className={clsx(
							"payment-form__input",
							validationErrors.customerEmail &&
								"payment-form__input--error"
						)}
						value={formData.customerEmail}
						onChange={(e) =>
							handleFieldChange("customerEmail", e.target.value)
						}
						placeholder="Enter your email address"
						disabled={loading}
						required={
							["PAYPAL", "STRIPE"].includes(formData.provider) ||
							customization?.customerFieldsRequired?.email
						}
					/>
					{validationErrors.customerEmail && (
						<div className="payment-form__error">
							{validationErrors.customerEmail}
						</div>
					)}
				</div>

				<div className="payment-form__field">
					<label className="payment-form__label">
						Phone Number
						{(formData.provider === "MPESA" ||
							customization?.customerFieldsRequired?.phone) && (
							<span className="payment-form__required">*</span>
						)}
					</label>
					<input
						type="tel"
						className={clsx(
							"payment-form__input",
							validationErrors.customerPhone &&
								"payment-form__input--error"
						)}
						value={formData.customerPhone}
						onChange={(e) =>
							handleFieldChange("customerPhone", e.target.value)
						}
						placeholder="+254712345678"
						disabled={loading}
						required={
							formData.provider === "MPESA" ||
							customization?.customerFieldsRequired?.phone
						}
					/>
					{validationErrors.customerPhone && (
						<div className="payment-form__error">
							{validationErrors.customerPhone}
						</div>
					)}
					<div className="payment-form__hint">
						Include country code (e.g., +254 for Kenya)
					</div>
				</div>

				<div className="payment-form__field">
					<label className="payment-form__label">
						Payment Description (Optional)
					</label>
					<input
						type="text"
						className="payment-form__input"
						value={formData.description}
						onChange={(e) =>
							handleFieldChange("description", e.target.value)
						}
						placeholder="What is this payment for?"
						disabled={loading}
						maxLength={200}
					/>
				</div>
			</div>

			{/* Provider Instructions */}
			{selectedProviderInfo && (
				<div className="payment-form__instructions">
					<h4>Payment Instructions</h4>
					<div className="payment-form__instructions-content">
						{formData.provider === "MPESA" && (
							<div className="payment-form__instruction-item">
								<div className="payment-form__instruction-icon">
									📱
								</div>
								<div>
									<strong>M-Pesa Payment:</strong> You will
									receive an SMS prompt on your phone. Enter
									your M-Pesa PIN to complete the payment.
								</div>
							</div>
						)}
						{formData.provider === "PAYPAL" && (
							<div className="payment-form__instruction-item">
								<div className="payment-form__instruction-icon">
									💙
								</div>
								<div>
									<strong>PayPal Payment:</strong> You will be
									redirected to PayPal to log in and authorize
									the payment.
								</div>
							</div>
						)}
						{formData.provider === "STRIPE" && (
							<div className="payment-form__instruction-item">
								<div className="payment-form__instruction-icon">
									💳
								</div>
								<div>
									<strong>Card Payment:</strong> You will be
									redirected to enter your card details
									securely.
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Amount Breakdown */}
			{customization?.showAmountBreakdown &&
				selectedProviderInfo?.fees && (
					<div className="payment-form__breakdown">
						<h4>Payment Breakdown</h4>
						<div className="payment-form__breakdown-item">
							<span>Amount:</span>
							<span>
								{formatCurrency(
									initialData.amount.amount,
									initialData.amount.currency
								)}
							</span>
						</div>
						{selectedProviderInfo.fees.fixedFee && (
							<div className="payment-form__breakdown-item">
								<span>Fixed Fee:</span>
								<span>
									{formatCurrency(
										selectedProviderInfo.fees.fixedFee,
										selectedProviderInfo.fees.currency
									)}
								</span>
							</div>
						)}
						{selectedProviderInfo.fees.percentageFee && (
							<div className="payment-form__breakdown-item">
								<span>
									Processing Fee (
									{(
										selectedProviderInfo.fees
											.percentageFee * 100
									).toFixed(1)}
									%):
								</span>
								<span>
									{formatCurrency(
										initialData.amount.amount *
											selectedProviderInfo.fees
												.percentageFee,
										initialData.amount.currency
									)}
								</span>
							</div>
						)}
						<div className="payment-form__breakdown-total">
							<span>Total:</span>
							<span>
								{formatCurrency(
									initialData.amount.amount +
										(selectedProviderInfo.fees.fixedFee ||
											0) +
										initialData.amount.amount *
											(selectedProviderInfo.fees
												.percentageFee || 0),
									initialData.amount.currency
								)}
							</span>
						</div>
					</div>
				)}

			{/* Error Display */}
			{error && (
				<div className="payment-form__error-banner">
					<div className="payment-form__error-icon">⚠️</div>
					<div className="payment-form__error-content">
						<strong>Payment Error:</strong> {error}
					</div>
				</div>
			)}

			{/* Submit Button */}
			<div className="payment-form__actions">
				<button
					type="submit"
					className={clsx(
						"payment-form__submit",
						`payment-form__submit--${
							theme?.buttonStyle || "default"
						}`
					)}
					disabled={
						loading || !formData.provider || !formData.paymentMethod
					}
				>
					{loading ? (
						<>
							<LoadingSpinner size="small" />
							Processing...
						</>
					) : (
						<>
							Pay{" "}
							{formatCurrency(
								initialData.amount.amount,
								initialData.amount.currency
							)}
							{selectedProviderInfo?.name &&
								` with ${selectedProviderInfo.name}`}
						</>
					)}
				</button>
			</div>

			{/* Security Notice */}
			<div className="payment-form__security-notice">
				<div className="payment-form__security-icon">🔒</div>
				<div className="payment-form__security-text">
					Your payment information is encrypted and secure. We never
					store your card details.
				</div>
			</div>

			{/* Provider-specific Additional Info */}
			{formData.provider === "MPESA" && (
				<div className="payment-form__provider-notice">
					<strong>M-Pesa Notice:</strong> Standard M-Pesa charges may
					apply. This payment will appear as a charge from Integration
					Platform.
				</div>
			)}
		</form>
	);
};
