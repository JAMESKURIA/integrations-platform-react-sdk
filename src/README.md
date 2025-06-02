# Integration Platform React SDK

A comprehensive React SDK for the Integration Platform, providing seamless payment processing with multiple providers including M-Pesa, PayPal, Stripe, and more.

[![npm version](https://badge.fury.io/js/@integration-platform/react-sdk.svg)](https://www.npmjs.com/package/@integration-platform/react-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

## 🚀 Features

-   **Multiple Payment Providers**: Support for M-Pesa, PayPal, Stripe, Flutterwave, Razorpay, and custom providers
-   **Responsive Payment Modal**: Beautiful, mobile-friendly payment interface
-   **Real-time Status Updates**: Automatic payment status polling and updates
-   **Callback Handling**: Complete webhook and redirect URL handling
-   **TypeScript Support**: Full type safety and IntelliSense support
-   **Customizable Themes**: Multiple built-in themes and full customization options
-   **Multi-tenant**: Built for multi-tenant applications
-   **Accessibility**: WCAG 2.1 compliant components
-   **Mobile Optimized**: Works perfectly on all device sizes

## 📦 Installation

```bash
npm install @integration-platform/react-sdk
```

```bash
yarn add @integration-platform/react-sdk
```

```bash
pnpm add @integration-platform/react-sdk
```

## 🏃‍♂️ Quick Start

### 1. Basic Payment Modal

```tsx
import React, { useState } from "react";
import {
	PaymentModal,
	createMoney,
	SDKConfig,
	PaymentResponse,
	PaymentError,
	DEFAULT_THEMES,
} from "@integration-platform/react-sdk";

const sdkConfig: SDKConfig = {
	baseUrl: "https://api.integration-platform.com",
	tenantId: "your-tenant-id",
	debug: true, // Enable for development
};

function App() {
	const [isModalOpen, setIsModalOpen] = useState(false);

	const paymentData = {
		amount: createMoney(100.0, "USD"),
		customerName: "John Doe",
		customerEmail: "john@example.com",
		customerPhone: "+1234567890",
		description: "Product purchase",
		billRefNumber: `ORDER-${Date.now()}`,
	};

	const handleSuccess = (payment: PaymentResponse) => {
		console.log("Payment successful:", payment);
		setIsModalOpen(false);
		// Handle successful payment
	};

	const handleError = (error: PaymentError) => {
		console.error("Payment failed:", error);
		// Handle payment error
	};

	return (
		<div>
			<button onClick={() => setIsModalOpen(true)}>Pay $100.00</button>

			<PaymentModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSuccess={handleSuccess}
				onError={handleError}
				paymentData={paymentData}
				config={sdkConfig}
				theme={DEFAULT_THEMES.modern}
			/>
		</div>
	);
}
```

### 2. Using the Payment Hook

```tsx
import React from "react";
import { usePayment, createMoney } from "@integration-platform/react-sdk";

function PaymentComponent() {
	const {
		payment,
		loading,
		error,
		providers,
		initiatePayment,
		checkPaymentStatus,
	} = usePayment({
		config: {
			baseUrl: "https://api.integration-platform.com",
			tenantId: "your-tenant-id",
		},
		onPaymentComplete: (payment) => {
			console.log("Payment completed:", payment);
		},
	});

	const handlePayment = async () => {
		try {
			await initiatePayment({
				amount: createMoney(50.0, "USD"),
				provider: "STRIPE",
				paymentMethod: "CREDIT_CARD",
				customerName: "Jane Doe",
				customerEmail: "jane@example.com",
				description: "Subscription payment",
			});
		} catch (err) {
			console.error("Payment failed:", err);
		}
	};

	return (
		<div>
			<h2>Available Providers: {providers.length}</h2>
			<button onClick={handlePayment} disabled={loading}>
				{loading ? "Processing..." : "Pay $50.00"}
			</button>
			{error && <div>Error: {error.message}</div>}
			{payment && <div>Status: {payment.status}</div>}
		</div>
	);
}
```

### 3. Callback Handler for Redirects

```tsx
import React from "react";
import { CallbackHandler } from "@integration-platform/react-sdk";

function PaymentCallbackPage() {
	return (
		<CallbackHandler
			config={{
				baseUrl: "https://api.integration-platform.com",
				tenantId: "your-tenant-id",
			}}
			onSuccess={(payment) => {
				console.log("Payment callback success:", payment);
				// Redirect to success page
				window.location.href = "/success";
			}}
			onError={(error) => {
				console.error("Payment callback error:", error);
				// Redirect to error page
				window.location.href = "/error";
			}}
			autoRedirect={true}
			redirectDelay={3000}
		/>
	);
}
```

## 🎨 Themes and Customization

### Built-in Themes

```tsx
import { DEFAULT_THEMES } from "@integration-platform/react-sdk";

// Available themes:
// - DEFAULT_THEMES.light
// - DEFAULT_THEMES.dark
// - DEFAULT_THEMES.minimal
// - DEFAULT_THEMES.modern

<PaymentModal
	theme={DEFAULT_THEMES.modern}
	// ... other props
/>;
```

### Custom Theme

```tsx
const customTheme = {
	primaryColor: "#6366f1",
	secondaryColor: "#8b5cf6",
	backgroundColor: "#ffffff",
	textColor: "#111827",
	borderColor: "#e5e7eb",
	borderRadius: "12px",
	fontSize: "14px",
	fontFamily: "Inter, system-ui, sans-serif",
	buttonStyle: "rounded" as const,
	modalStyle: "centered" as const,
};

<PaymentModal theme={customTheme} />;
```

### Advanced Customization

```tsx
const customization = {
	title: "Complete Your Order",
	subtitle: "Choose your preferred payment method",
	customerFieldsRequired: {
		email: true,
		phone: false,
	},
	showAmountBreakdown: true,
	showPaymentMethods: true,
	showProviderLogos: true,
	translations: {
		pay_button: "Complete Payment",
		processing: "Processing your payment...",
	},
};

<PaymentModal customization={customization} />;
```

## 🔧 Configuration

### SDK Configuration

```tsx
const sdkConfig: SDKConfig = {
	baseUrl: "https://api.integration-platform.com", // Required
	tenantId: "your-tenant-id", // Required
	authToken: "your-auth-token", // Optional
	timeout: 30000, // Optional (default: 30s)
	debug: process.env.NODE_ENV === "development", // Optional
};
```

### Environment Setup

```bash
# .env.local
REACT_APP_INTEGRATION_PLATFORM_URL=https://api.integration-platform.com
REACT_APP_TENANT_ID=your-tenant-id
REACT_APP_AUTH_TOKEN=your-auth-token
```

## 💳 Supported Payment Providers

| Provider | Code | Payment Methods | Currencies |
