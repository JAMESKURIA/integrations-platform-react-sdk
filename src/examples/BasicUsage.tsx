/**
 * Basic Usage Example
 * Demonstrates how to integrate the Integration Platform React SDK
 */

import {
	createMoney,
	DEFAULT_THEMES,
	PaymentError,
	PaymentModal,
	PaymentModalRef,
	PaymentRequest,
	PaymentResponse,
	SDKConfig,
} from "@integration-platform/react-sdk";
import React, { useRef, useState } from "react";

// Your SDK configuration
const sdkConfig: SDKConfig = {
	baseUrl: "https://api.integration-platform.com", // Replace with your API URL
	tenantId: "your-tenant-id", // Replace with your tenant ID
	authToken: "your-auth-token", // Optional: for authenticated requests
	debug: true, // Enable debug mode for development
};

const BasicUsageExample: React.FC = () => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [lastPayment, setLastPayment] = useState<PaymentResponse | null>(
		null
	);
	const [lastError, setLastError] = useState<PaymentError | null>(null);
	const modalRef = useRef<PaymentModalRef>(null);

	// Payment data (everything except provider and payment method)
	const paymentData: Omit<PaymentRequest, "provider" | "paymentMethod"> = {
		amount: createMoney(100.0, "USD"), // $100.00
		customerName: "John Doe",
		customerEmail: "john.doe@example.com",
		customerPhone: "+1234567890",
		description: "Product purchase",
		billRefNumber: `ORDER-${Date.now()}`, // Unique reference
		callbackUrl: `${window.location.origin}/payment/callback`,
		returnUrl: `${window.location.origin}/payment/success`,
		cancelUrl: `${window.location.origin}/payment/cancel`,
		metadata: {
			orderId: "12345",
			customerId: "CUST-001",
		},
	};

	// Handle successful payment
	const handlePaymentSuccess = (payment: PaymentResponse) => {
		console.log("Payment successful:", payment);
		setLastPayment(payment);
		setLastError(null);

		// Close modal after 2 seconds
		setTimeout(() => {
			setIsModalOpen(false);
		}, 2000);

		// You can also redirect or show a success message
		// window.location.href = '/order-confirmation';
	};

	// Handle payment error
	const handlePaymentError = (error: PaymentError) => {
		console.error("Payment failed:", error);
		setLastError(error);
		setLastPayment(null);
	};

	// Handle modal close
	const handleModalClose = () => {
		setIsModalOpen(false);
	};

	return (
		<div className="basic-usage-example">
			<div className="container">
				<h1>Integration Platform Payment Demo</h1>

				{/* Trigger Payment Button */}
				<div className="payment-section">
					<h2>Make a Payment</h2>
					<p>Click the button below to open the payment modal</p>

					<button
						onClick={() => setIsModalOpen(true)}
						className="pay-button"
						style={{
							padding: "12px 24px",
							backgroundColor: "#3b82f6",
							color: "white",
							border: "none",
							borderRadius: "8px",
							fontSize: "16px",
							fontWeight: "600",
							cursor: "pointer",
							transition: "all 0.2s ease",
						}}
						onMouseOver={(e) => {
							e.currentTarget.style.backgroundColor = "#2563eb";
						}}
						onMouseOut={(e) => {
							e.currentTarget.style.backgroundColor = "#3b82f6";
						}}
					>
						Pay $100.00
					</button>

					{/* Alternative: Use ref to control modal */}
					<button
						onClick={() => modalRef.current?.openModal()}
						className="pay-button-ref"
						style={{
							padding: "12px 24px",
							backgroundColor: "#059669",
							color: "white",
							border: "none",
							borderRadius: "8px",
							fontSize: "16px",
							fontWeight: "600",
							cursor: "pointer",
							marginLeft: "12px",
						}}
					>
						Pay (using ref)
					</button>
				</div>

				{/* Payment Status Display */}
				{lastPayment && (
					<div className="payment-result success">
						<h3>✅ Payment Successful!</h3>
						<p>
							<strong>Transaction ID:</strong>{" "}
							{lastPayment.transactionId}
						</p>
						<p>
							<strong>Amount:</strong> $
							{lastPayment.amount.amount}{" "}
							{lastPayment.amount.currency}
						</p>
						<p>
							<strong>Status:</strong> {lastPayment.status}
						</p>
						{lastPayment.providerReceiptNumber && (
							<p>
								<strong>Receipt:</strong>{" "}
								{lastPayment.providerReceiptNumber}
							</p>
						)}
					</div>
				)}

				{lastError && (
					<div className="payment-result error">
						<h3>❌ Payment Failed</h3>
						<p>
							<strong>Error:</strong> {lastError.message}
						</p>
						<p>
							<strong>Code:</strong> {lastError.code}
						</p>
					</div>
				)}

				{/* Payment Modal */}
				<PaymentModal
					ref={modalRef}
					isOpen={isModalOpen}
					onClose={handleModalClose}
					onSuccess={handlePaymentSuccess}
					onError={handlePaymentError}
					paymentData={paymentData}
					config={sdkConfig}
					theme={DEFAULT_THEMES.modern} // Use modern theme
					showProviderLogos={true}
					customization={{
						title: "Complete Your Payment",
						subtitle: "Choose your preferred payment method",
						customerFieldsRequired: {
							email: true,
							phone: false,
						},
						showAmountBreakdown: true,
						showPaymentMethods: true,
					}}
				/>

				{/* Payment Instructions */}
				<div className="instructions">
					<h2>How to Test</h2>
					<ol>
						<li>
							Click the "Pay $100.00" button to open the payment
							modal
						</li>
						<li>
							Select a payment provider (M-Pesa, PayPal, Stripe,
							etc.)
						</li>
						<li>Fill in the required customer information</li>
						<li>Click "Pay" to initiate the payment</li>
						<li>Follow the provider-specific instructions</li>
					</ol>

					<h3>Test Credentials</h3>
					<div className="test-credentials">
						<h4>M-Pesa (Kenya)</h4>
						<p>Phone: +254712345678</p>

						<h4>Stripe (Test Cards)</h4>
						<p>Success: 4242424242424242</p>
						<p>Failure: 4000000000000002</p>

						<h4>PayPal</h4>
						<p>Use PayPal sandbox credentials</p>
					</div>
				</div>
			</div>

			<style jsx>{`
				.basic-usage-example {
					max-width: 800px;
					margin: 0 auto;
					padding: 20px;
					font-family: "Inter", system-ui, sans-serif;
					line-height: 1.6;
				}

				.container {
					display: flex;
					flex-direction: column;
					gap: 32px;
				}

				.payment-section {
					padding: 24px;
					border: 1px solid #e5e7eb;
					border-radius: 12px;
					background: #f8fafc;
				}

				.payment-result {
					padding: 20px;
					border-radius: 8px;
					margin-top: 20px;
				}

				.payment-result.success {
					background: #f0fdf4;
					border: 1px solid #bbf7d0;
					color: #166534;
				}

				.payment-result.error {
					background: #fef2f2;
					border: 1px solid #fecaca;
					color: #dc2626;
				}

				.instructions {
					padding: 24px;
					background: #ffffff;
					border: 1px solid #e5e7eb;
					border-radius: 12px;
				}

				.instructions h2 {
					margin-top: 0;
					color: #1f2937;
				}

				.instructions ol {
					padding-left: 20px;
				}

				.instructions li {
					margin-bottom: 8px;
				}

				.test-credentials {
					margin-top: 20px;
					padding: 16px;
					background: #f3f4f6;
					border-radius: 8px;
				}

				.test-credentials h4 {
					margin: 16px 0 8px 0;
					color: #374151;
				}

				.test-credentials h4:first-child {
					margin-top: 0;
				}

				.test-credentials p {
					margin: 4px 0;
					font-family: "Monaco", "Menlo", monospace;
					font-size: 14px;
					color: #6b7280;
				}
			`}</style>
		</div>
	);
};

export default BasicUsageExample;
