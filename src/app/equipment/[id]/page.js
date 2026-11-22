"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function EquipmentDetails() {
  const { id } = useParams();
  const [equipment, setEquipment] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(`${api}/api/equipment/${encodeURIComponent(id)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Equipment could not be found.");
        setEquipment(data.equipment);
      })
      .catch((cause) => setError(cause.message));
  }, [id]);

  return <main className="site-shell details-shell"><header className="topbar"><Link className="brand" href="/">EquipRent<span>.</span></Link><Link className="back-link" href="/">← All equipment</Link></header>
    {error ? <p className="notice error">{error}</p> : !equipment ? <p className="empty">Loading equipment details…</p> : <article className="details-layout"><div className="details-photo" style={equipment.image ? { backgroundImage: `url("${equipment.image}")` } : undefined} /><section className="details-copy"><p className="eyebrow">{equipment.category} · {equipment.location}</p><h1>{equipment.name}</h1><p className="details-description">{equipment.description}</p><div className="details-price">৳{equipment.rentalPrice ?? equipment.pricePerDay}<span> / {equipment.rentalType || "daily"}</span></div><dl className="spec-list"><div><dt>Rental period</dt><dd>{equipment.rentalType || "daily"}</dd></div><div><dt>Available quantity</dt><dd>{equipment.availableQuantity ?? 1} units</dd></div><div><dt>Brand / model</dt><dd>{[equipment.brand, equipment.model].filter(Boolean).join(" · ") || "Not specified"}</dd></div><div><dt>Condition</dt><dd>{equipment.condition || "Good"}</dd></div><div><dt>Rental terms</dt><dd>{equipment.rentalTerms || "Confirm dates and delivery details at booking."}</dd></div></dl><Link className="result-action" href={`/?equipment=${encodeURIComponent(equipment._id)}`}>Book this equipment</Link><p className="secure-note">Availability and final pricing are checked by EquipRent before Stripe Checkout.</p></section></article>}
  </main>;
}
