"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function MyRentals() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [state, setState] = useState({ loading: true, error: "" });
  useEffect(() => {
    const load = async () => {
      try {
        const authResponse = await fetch(`${api}/api/auth/token`, { credentials: "include" });
        const auth = await authResponse.json().catch(() => ({}));
        if (!authResponse.ok || !auth.token) {
          router.push(`/sign-in?returnTo=${encodeURIComponent("/my-rentals")}`);
          return;
        }
        const response = await fetch(`${api}/api/bookings/my`, { headers: { Authorization: `Bearer ${auth.token}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load rentals.");
        setBookings(data.data || []); setState({ loading: false, error: "" });
      } catch (error) { setState({ loading: false, error: error.message }); }
    };
    load();
  }, [router]);

  return <main className="site-shell"><header className="topbar"><Link className="brand" href="/">EquipRent<span>.</span></Link><Link className="back-link" href="/">← Equipment catalog</Link></header><section className="rentals-section"><p className="eyebrow">YOUR ACCOUNT</p><h1>My rentals</h1><p className="rentals-intro">Your paid bookings and their current fulfillment status.</p>{state.loading ? <p className="empty">Loading your rentals…</p> : state.error ? <p className="notice error">{state.error}</p> : bookings.length === 0 ? <p className="empty">No bookings yet. Your paid rentals will appear here.</p> : <div className="rentals-list">{bookings.map((booking) => <article className="rental-row" key={booking._id}><div><p className="category">BOOKING · {String(booking._id).slice(-8).toUpperCase()}</p><h2>{booking.startDate} <span>to</span> {booking.endDate}</h2><p>{booking.quantity} unit{booking.quantity === 1 ? "" : "s"} · ৳{booking.totalPrice} · payment {booking.paymentStatus}</p></div><span className={`rental-status ${booking.status}`}>{booking.status}</span></article>)}</div>}</section></main>;
}
