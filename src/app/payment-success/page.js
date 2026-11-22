"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function PaymentSuccess() {
  const [state, setState] = useState({ loading: true, message: "Checking Stripe payment status…" });
  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) { Promise.resolve().then(() => setState({ loading: false, error: true, message: "This page needs a Checkout Session reference." })); return; }
    let active = true;
    let timer;
    let attempts = 0;
    const check = async () => {
      try {
        const tokenResponse = await fetch(`${api}/api/auth/token`, { credentials: "include" });
        const tokenData = await tokenResponse.json().catch(() => ({}));
        if (!tokenResponse.ok || !tokenData.token) throw new Error("Sign in to view the payment result for your account.");
        const response = await fetch(`${api}/api/payments/checkout-session/${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Bearer ${tokenData.token}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to verify this payment.");
        if (!active) return;
        if (data.status === "paid" && data.booking) setState({ loading: false, paid: true, booking: data.booking });
        else if (data.status === "payment_review" || data.status === "review") setState({ loading: false, error: true, message: "Stripe confirmed payment, and EquipRent is reviewing the booking. Please contact support with your Checkout reference." });
        else if (attempts++ < 12) {
          setState({ loading: true, message: "Payment received by Stripe. Waiting for the secure booking confirmation…" });
          timer = setTimeout(check, 4000);
        } else setState({ loading: false, message: "Payment confirmation is still processing. Check My Rentals shortly; this page has not marked the payment as paid." });
      } catch (error) { if (active) setState({ loading: false, error: true, message: error.message }); }
    };
    check();
    return () => { active = false; clearTimeout(timer); };
  }, []);

  return <main className="result-shell"><section className="result-card"><Link className="brand" href="/">EquipRent<span>.</span></Link><div className="result-mark">{state.paid ? "✓" : state.loading ? "…" : "!"}</div>
    <p className="eyebrow">PAYMENT STATUS</p><h1>{state.paid ? "Booking confirmed" : state.loading ? "Confirming your payment" : state.error ? "We couldn’t verify this yet" : "Confirmation pending"}</h1><p className={state.error ? "result-error" : ""}>{state.message || "Your Stripe payment is confirmed and the booking is saved."}</p>
    {state.paid && <div className="result-detail"><strong>Booking reference</strong> · {state.booking.id}<br /><strong>Rental dates</strong> · {state.booking.startDate} to {state.booking.endDate}<br /><strong>Quantity</strong> · {state.booking.quantity}<br /><strong>Total paid</strong> · ৳{state.booking.totalPrice}</div>}
    {state.paid ? <Link className="result-action" href="/my-rentals">View my rentals</Link> : <Link className="result-action" href="/">Return to equipment</Link>}
  </section></main>;
}
