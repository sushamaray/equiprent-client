import Link from "next/link";

export default function PaymentCancelled() {
  return <main className="result-shell"><section className="result-card"><Link className="brand" href="/">EquipRent<span>.</span></Link><div className="result-mark">↩</div><p className="eyebrow">CHECKOUT NOT COMPLETED</p><h1>No payment was confirmed</h1><p>You left Stripe Checkout before completing payment. EquipRent has not marked a payment as received. If you still want the equipment, return to the catalog and start a new checkout.</p><Link className="result-action" href="/">Back to equipment</Link></section></main>;
}
