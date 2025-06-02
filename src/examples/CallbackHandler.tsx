/**
 * Callback Handler Example
 * Demonstrates how to handle payment callbacks and redirects
 */

import {
	CallbackHandler,
	PaymentError,
	PaymentResponse,
	SDKConfig,
	parseCallbackParams,
} from "@integration-platform/react-sdk";
import React from "react";

// Your SDK configuration
const sdkConfig: SDKConfig = {
	baseUrl: "https://api.integration-platform.com",
	tenantId: "your-tenant-id",
	debug: true,
};

const CallbackHandlerExample: React.FC = () => {
	// Handle successful payment callback
	const handlePaymentSuccess = (payment: PaymentResponse) => {
		console.log("Payment callback - Success:", payment);

		// Track success in analytics
		if (typeof gtag !== "undefined") {
			gtag("event", "payment_success", {
				transaction_id: payment.transactionId,
				value: payment.amount.amount,
				currency: payment.amount.currency,
				payment_provider: payment.provider,
			});
		}

		// Show success notification
		showNotification("Payment completed successfully!", "success");

		// Optional: Send to your backend for verification
		verifyPaymentWithBackend(payment.transactionId);

		// Optional: Redirect to success page after delay
		setTimeout(() => {
			window.location.href = "/order-confirmation";
		}, 3000);
	};

	// Handle payment error callback
	const handlePaymentError = (error: PaymentError) => {
		console.error("Payment callback - Error:", error);

		// Track error in analytics
		if (typeof gtag !== "undefined") {
			gtag("event", "payment_error", {
				error_code: error.code,
				error_message: error.message,
				transaction_id: error.transactionId,
			});
		}

		// Show error notification
		showNotification(`Payment failed: ${error.message}`, "error");

		// Optional: Log error to monitoring service
		logErrorToService(error);
	};

	// Handle payment cancellation
	const handlePaymentCancel = () => {
		console.log("Payment callback - Cancelled");

		// Track cancellation in analytics
		if (typeof gtag !== "undefined") {
			gtag("event", "payment_cancel");
		}

		// Show cancellation message
		showNotification("Payment was cancelled", "warning");

		// Optional: Redirect back to cart/checkout
		setTimeout(() => {
			window.location.href = "/checkout";
		}, 2000);
	};

	// Utility function to show notifications
	const showNotification = (
		message: string,
		type: "success" | "error" | "warning"
	) => {
		// You can replace this with your preferred notification library
		const notification = document.createElement("div");
		notification.className = `notification notification--${type}`;
		notification.textContent = message;
		notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      z-index: 10000;
      background: ${
			type === "success"
				? "#059669"
				: type === "error"
				? "#dc2626"
				: "#d97706"
		};
      animation: slideIn 0.3s ease;
    `;

		document.body.appendChild(notification);

		setTimeout(() => {
			notification.remove();
		}, 5000);
	};

	// Verify payment with your backend
	const verifyPaymentWithBackend = async (transactionId: string) => {
		try {
			const response = await fetch("/api/payments/verify", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ transactionId }),
			});

			if (response.ok) {
				const result = await response.json();
				console.log("Payment verified:", result);
			}
		} catch (error) {
			console.error("Failed to verify payment:", error);
		}
	};

	// Log error to monitoring service
	const logErrorToService = (error: PaymentError) => {
		// Replace with your monitoring service (Sentry, LogRocket, etc.)
		try {
			fetch("/api/errors/log", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					error: error.message,
					code: error.code,
					transactionId: error.transactionId,
					timestamp: new Date().toISOString(),
					userAgent: navigator.userAgent,
					url: window.location.href,
				}),
			});
		} catch (logError) {
			console.error("Failed to log error:", logError);
		}
	};

	// Custom loading component
	const CustomLoadingComponent = () => (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				height: "100vh",
				background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
				color: "white",
				fontFamily: "Inter, system-ui, sans-serif",
			}}
		>
			<div
				style={{
					width: "60px",
					height: "60px",
					border: "4px solid rgba(255,255,255,0.3)",
					borderTop: "4px solid white",
					borderRadius: "50%",
					animation: "spin 1s linear infinite",
					marginBottom: "24px",
				}}
			/>
			<h2
				style={{
					margin: "0 0 8px",
					fontSize: "24px",
					fontWeight: "600",
				}}
			>
				Processing Payment
			</h2>
			<p style={{ margin: 0, fontSize: "16px", opacity: 0.9 }}>
				Please wait while we verify your payment...
			</p>

			<style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
		</div>
	);

	// Custom success component
	const CustomSuccessComponent = (payment: PaymentResponse) => (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				height: "100vh",
				background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
				color: "white",
				fontFamily: "Inter, system-ui, sans-serif",
				textAlign: "center",
				padding: "20px",
			}}
		>
			<div style={{ fontSize: "80px", marginBottom: "24px" }}>✅</div>
			<h1
				style={{
					margin: "0 0 16px",
					fontSize: "32px",
					fontWeight: "700",
				}}
			>
				Payment Successful!
			</h1>
			<p style={{ margin: "0 0 24px", fontSize: "18px", opacity: 0.9 }}>
				Your payment of ${payment.amount.amount}{" "}
				{payment.amount.currency} has been processed.
			</p>
			<div
				style={{
					background: "rgba(255,255,255,0.1)",
					padding: "20px",
					borderRadius: "12px",
					marginBottom: "32px",
				}}
			>
				<p
					style={{
						margin: "0 0 8px",
						fontSize: "14px",
						opacity: 0.8,
					}}
				>
					Transaction ID
				</p>
				<p
					style={{
						margin: 0,
						fontSize: "16px",
						fontWeight: "600",
						fontFamily: "Monaco, monospace",
						wordBreak: "break-all",
					}}
				>
					{payment.transactionId}
				</p>
			</div>
			<p style={{ margin: 0, fontSize: "14px", opacity: 0.8 }}>
				This window will close automatically in a few seconds...
			</p>
		</div>
	);

	// Custom error component
	const CustomErrorComponent = (error: PaymentError) => (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				height: "100vh",
				background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
				color: "white",
				fontFamily: "Inter, system-ui, sans-serif",
				textAlign: "center",
				padding: "20px",
			}}
		>
			<div style={{ fontSize: "80px", marginBottom: "24px" }}>❌</div>
			<h1
				style={{
					margin: "0 0 16px",
					fontSize: "32px",
					fontWeight: "700",
				}}
			>
				Payment Failed
			</h1>
			<p style={{ margin: "0 0 24px", fontSize: "18px", opacity: 0.9 }}>
				{error.message}
			</p>
			{error.code && (
				<div
					style={{
						background: "rgba(255,255,255,0.1)",
						padding: "16px",
						borderRadius: "8px",
						marginBottom: "32px",
					}}
				>
					<p
						style={{
							margin: "0 0 4px",
							fontSize: "12px",
							opacity: 0.8,
						}}
					>
						Error Code
					</p>
					<p
						style={{
							margin: 0,
							fontSize: "14px",
							fontWeight: "600",
							fontFamily: "Monaco, monospace",
						}}
					>
						{error.code}
					</p>
				</div>
			)}
			<button
				onClick={() => window.history.back()}
				style={{
					padding: "12px 24px",
					background: "rgba(255,255,255,0.2)",
					border: "2px solid white",
					borderRadius: "8px",
					color: "white",
					fontSize: "16px",
					fontWeight: "600",
					cursor: "pointer",
					transition: "all 0.2s ease",
				}}
				onMouseOver={(e) => {
					e.currentTarget.style.background = "white";
					e.currentTarget.style.color = "#ee5a24";
				}}
				onMouseOut={(e) => {
					e.currentTarget.style.background = "rgba(255,255,255,0.2)";
					e.currentTarget.style.color = "white";
				}}
			>
				Go Back
			</button>
		</div>
	);

	return (
		<>
			<CallbackHandler
				config={sdkConfig}
				onSuccess={handlePaymentSuccess}
				onError={handlePaymentError}
				onCancel={handlePaymentCancel}
				autoRedirect={true}
				redirectDelay={5000} // 5 seconds
				customLoadingComponent={<CustomLoadingComponent />}
				customSuccessComponent={CustomSuccessComponent}
				customErrorComponent={CustomErrorComponent}
				options={{
					pollInterval: 3000, // Check status every 3 seconds
					maxPollAttempts: 20, // Maximum 1 minute of polling
				}}
			/>
		</>
	);
};

// Example of how to use the callback handler in different routes
export const CallbackRoutes = () => {
	// Parse URL parameters to determine what to show
	const callbackParams = parseCallbackParams();

	return (
		<div>
			{callbackParams.transactionId ? (
				// Show callback handler if transaction ID is present
				<CallbackHandlerExample />
			) : (
				// Show default content if no callback parameters
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						height: "100vh",
						fontFamily: "Inter, system-ui, sans-serif",
						textAlign: "center",
					}}
				>
					<h1>Payment Callback Handler</h1>
					<p>This page handles payment callbacks from providers.</p>
					<p>No payment callback detected in the URL.</p>

					<div style={{ marginTop: "32px" }}>
						<h2>Callback URL Format:</h2>
						<code
							style={{
								display: "block",
								background: "#f3f4f6",
								padding: "12px",
								borderRadius: "8px",
								marginTop: "12px",
								fontSize: "14px",
							}}
						>
							{window.location.origin}
							/payment/callback?transactionId=txn_123&status=success
						</code>
					</div>
				</div>
			)}
		</div>
	);
};

export default CallbackHandlerExample;
