/**
 * Payment Status Component
 * Displays payment completion status with appropriate actions
 */

import clsx from "clsx";
import React, { useCallback } from "react";
import "../styles/PaymentStatus.css";
import { PaymentError, PaymentStatusProps } from "../types";

export const PaymentStatus: React.FC<
	PaymentStatusProps & { error?: PaymentError | null }
> = ({
	payment,
	error,
	onClose,
	onRetry,
	theme,
	showTransactionDetails = true,
}) => {
	const isSuccess = payment?.status === "COMPLETED";
	const isFailure =
		payment?.status === "FAILED" ||
		payment?.status === "CANCELLED" ||
		!!error;
	const isPending =
		payment?.status === "PENDING" || payment?.status === "PROCESSING";

	const formatDateTime = useCallback((dateString: string) => {
		return new Date(dateString).toLocaleString();
	}, []);

	const formatCurrency = useCallback((amount: number, currency: string) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: currency,
		}).format(amount);
	}, []);

	const copyToClipboard = useCallback((text: string) => {
		navigator.clipboard.writeText(text).then(() => {
			// Could show a toast notification here
			console.log("Copied to clipboard:", text);
		});
	}, []);

	const getStatusIcon = () => {
		if (isSuccess) return "✅";
		if (isFailure) return "❌";
		if (isPending) return "⏳";
		return "❓";
	};

	const getStatusTitle = () => {
		if (isSuccess) return "Payment Successful!";
		if (isFailure) return "Payment Failed";
		if (isPending) return "Payment in Progress";
		return "Payment Status Unknown";
	};

	const getStatusMessage = () => {
		if (isSuccess && payment) {
			return `Your payment of ${formatCurrency(
				payment.amount.amount,
				payment.amount.currency
			)} has been processed successfully.`;
		}
		if (isFailure) {
			return (
				error?.message ||
				payment?.errorMessage ||
				"The payment could not be completed."
			);
		}
		if (isPending && payment) {
			return (
				payment.statusMessage ||
				"Your payment is being processed. Please wait..."
			);
		}
		return "Unable to determine payment status.";
	};

	const getNextSteps = () => {
		if (isSuccess) {
			return [
				"You will receive a confirmation email shortly",
				"Check your account for the transaction",
				"Keep your transaction ID for your records",
			];
		}
		if (isFailure) {
			return [
				"Please check your payment details and try again",
				"Contact support if the problem persists",
				"Your account has not been charged",
			];
		}
		if (isPending) {
			return [
				"Do not refresh or close this page",
				"The status will update automatically",
				"This may take a few minutes",
			];
		}
		return [];
	};

	return (
		<div
			className={clsx(
				"payment-status",
				`payment-status--${
					isSuccess ? "success" : isFailure ? "failure" : "pending"
				}`
			)}
		>
			{/* Status Header */}
			<div className="payment-status__header">
				<div className="payment-status__icon">{getStatusIcon()}</div>
				<h3 className="payment-status__title">{getStatusTitle()}</h3>
				<p className="payment-status__message">{getStatusMessage()}</p>
			</div>

			{/* Transaction Details */}
			{showTransactionDetails && payment && (
				<div className="payment-status__details">
					<h4>Transaction Details</h4>

					<div className="payment-status__detail-grid">
						<div className="payment-status__detail-item">
							<span className="payment-status__detail-label">
								Transaction ID:
							</span>
							<span className="payment-status__detail-value">
								{payment.transactionId}
								<button
									type="button"
									className="payment-status__copy-button"
									onClick={() =>
										copyToClipboard(payment.transactionId)
									}
									title="Copy transaction ID"
								>
									📋
								</button>
							</span>
						</div>

						<div className="payment-status__detail-item">
							<span className="payment-status__detail-label">
								Amount:
							</span>
							<span className="payment-status__detail-value">
								{formatCurrency(
									payment.amount.amount,
									payment.amount.currency
								)}
							</span>
						</div>

						<div className="payment-status__detail-item">
							<span className="payment-status__detail-label">
								Payment Method:
							</span>
							<span className="payment-status__detail-value">
								{payment.provider}
							</span>
						</div>

						<div className="payment-status__detail-item">
							<span className="payment-status__detail-label">
								Date & Time:
							</span>
							<span className="payment-status__detail-value">
								{formatDateTime(payment.createdAt)}
							</span>
						</div>

						{payment.billRefNumber && (
							<div className="payment-status__detail-item">
								<span className="payment-status__detail-label">
									Reference:
								</span>
								<span className="payment-status__detail-value">
									{payment.billRefNumber}
								</span>
							</div>
						)}

						{payment.providerReceiptNumber && (
							<div className="payment-status__detail-item">
								<span className="payment-status__detail-label">
									Receipt Number:
								</span>
								<span className="payment-status__detail-value">
									{payment.providerReceiptNumber}
									<button
										type="button"
										className="payment-status__copy-button"
										onClick={() =>
											copyToClipboard(
												payment.providerReceiptNumber!
											)
										}
										title="Copy receipt number"
									>
										📋
									</button>
								</span>
							</div>
						)}

						{payment.providerTransactionId &&
							payment.providerTransactionId !==
								payment.transactionId && (
								<div className="payment-status__detail-item">
									<span className="payment-status__detail-label">
										Provider Transaction ID:
									</span>
									<span className="payment-status__detail-value">
										{payment.providerTransactionId}
									</span>
								</div>
							)}
					</div>
				</div>
			)}

			{/* Error Details */}
			{(error || payment?.errorCode) && (
				<div className="payment-status__error-details">
					<h4>Error Information</h4>
					<div className="payment-status__error-content">
						<div className="payment-status__error-code">
							Error Code: {error?.code || payment?.errorCode}
						</div>
						<div className="payment-status__error-message">
							{error?.message || payment?.errorMessage}
						</div>
					</div>
				</div>
			)}

			{/* Next Steps */}
			<div className="payment-status__next-steps">
				<h4>What's Next?</h4>
				<ul className="payment-status__steps-list">
					{getNextSteps().map((step, index) => (
						<li key={index} className="payment-status__step-item">
							{step}
						</li>
					))}
				</ul>
			</div>

			{/* Provider-specific Instructions */}
			{payment?.nextAction && payment.nextAction.type !== "NONE" && (
				<div className="payment-status__next-action">
					<h4>Action Required</h4>
					<div className="payment-status__action-content">
						{payment.nextAction.instructions && (
							<p className="payment-status__action-instructions">
								{payment.nextAction.instructions}
							</p>
						)}

						{payment.nextAction.type === "REDIRECT" &&
							payment.nextAction.url && (
								<a
									href={payment.nextAction.url}
									target="_blank"
									rel="noopener noreferrer"
									className="payment-status__action-button payment-status__action-button--primary"
								>
									Continue to Payment
								</a>
							)}

						{payment.nextAction.type === "DISPLAY_QR" &&
							payment.nextAction.qrCode && (
								<div className="payment-status__qr-code">
									<p>
										Scan this QR code with your payment app:
									</p>
									<img
										src={`data:image/png;base64,${payment.nextAction.qrCode}`}
										alt="Payment QR Code"
										className="payment-status__qr-image"
									/>
								</div>
							)}

						{payment.nextAction.type === "USSD_DIAL" &&
							payment.nextAction.ussdCode && (
								<div className="payment-status__ussd">
									<p>Dial this USSD code on your phone:</p>
									<div className="payment-status__ussd-code">
										{payment.nextAction.ussdCode}
										<button
											type="button"
											className="payment-status__copy-button"
											onClick={() =>
												copyToClipboard(
													payment.nextAction!
														.ussdCode!
												)
											}
											title="Copy USSD code"
										>
											📋
										</button>
									</div>
								</div>
							)}
					</div>
				</div>
			)}

			{/* Actions */}
			<div className="payment-status__actions">
				{isSuccess && (
					<button
						type="button"
						className={clsx(
							"payment-status__button",
							"payment-status__button--primary",
							`payment-status__button--${
								theme?.buttonStyle || "default"
							}`
						)}
						onClick={onClose}
					>
						Continue
					</button>
				)}

				{isFailure && (
					<div className="payment-status__failure-actions">
						{onRetry && (
							<button
								type="button"
								className={clsx(
									"payment-status__button",
									"payment-status__button--primary",
									`payment-status__button--${
										theme?.buttonStyle || "default"
									}`
								)}
								onClick={onRetry}
							>
								Try Again
							</button>
						)}
						<button
							type="button"
							className={clsx(
								"payment-status__button",
								"payment-status__button--secondary",
								`payment-status__button--${
									theme?.buttonStyle || "default"
								}`
							)}
							onClick={onClose}
						>
							Close
						</button>
					</div>
				)}

				{isPending && (
					<div className="payment-status__pending-actions">
						<button
							type="button"
							className={clsx(
								"payment-status__button",
								"payment-status__button--secondary",
								`payment-status__button--${
									theme?.buttonStyle || "default"
								}`
							)}
							onClick={onClose}
						>
							Continue in Background
						</button>
					</div>
				)}
			</div>

			{/* Support Contact */}
			<div className="payment-status__support">
				<p>
					Need help? Contact our support team with your transaction
					ID: {payment?.transactionId}
				</p>
			</div>
		</div>
	);
};
