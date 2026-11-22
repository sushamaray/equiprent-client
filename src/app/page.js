
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const api =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const categories = [
  {
    number: "01",
    icon: "🏗️",
    name: "Construction Equipment",
    description: "Heavy machinery and tools for every build.",
  },
  {
    number: "02",
    icon: "📷",
    name: "Photography Equipment",
    description: "Cameras, lenses and creative gear.",
  },
  {
    number: "03",
    icon: "🚚",
    name: "Vehicles & Transportation",
    description: "Transport solutions for every project.",
  },
  {
    number: "04",
    icon: "🌾",
    name: "Agriculture Equipment",
    description: "Reliable machinery for modern farming.",
  },
  {
    number: "05",
    icon: "💻",
    name: "Electronics",
    description: "Technology for work and everyday needs.",
  },
  {
    number: "06",
    icon: "🎪",
    name: "Event Equipment",
    description: "Everything needed to bring events to life.",
  },
];

const benefits = [
  {
    number: "01",
    icon: "◈",
    title: "Transparent pricing",
    description:
      "Clear rental prices and flexible daily, weekly and monthly options.",
  },
  {
    number: "02",
    icon: "✓",
    title: "Approved equipment",
    description:
      "Equipment listings are reviewed before becoming publicly available.",
  },
  {
    number: "03",
    icon: "↗",
    title: "Flexible rentals",
    description:
      "Choose rental dates and quantities that match your project.",
  },
  {
    number: "04",
    icon: "◇",
    title: "Secure payments",
    description:
      "Complete your rental payment through Stripe Checkout.",
  },
];

const steps = [
  {
    number: "01",
    title: "Find your equipment",
    description:
      "Explore approved equipment and choose what your project needs.",
  },
  {
    number: "02",
    title: "Choose your dates",
    description:
      "Select your rental period, quantity and delivery information.",
  },
  {
    number: "03",
    title: "Pay securely",
    description:
      "Complete payment through Stripe and receive your booking confirmation.",
  },
];

const reviews = [
  {
    name: "Ayesha Rahman",
    role: "Photography customer",
    rating: 5,
    initials: "AR",
    quote:
      "Finding the right camera equipment for a short project is much easier when rental options are organized in one place.",
  },
  {
    name: "Tanvir Ahmed",
    role: "Construction customer",
    rating: 5,
    initials: "TA",
    quote:
      "The ability to choose the rental period and quantity makes planning equipment needs more convenient.",
  },
  {
    name: "Nusrat Jahan",
    role: "Event organizer",
    rating: 5,
    initials: "NJ",
    quote:
      "Having different equipment categories together makes it easier to plan what an event requires.",
  },
  {
    name: "Sakib Hasan",
    role: "Small business owner",
    rating: 5,
    initials: "SH",
    quote:
      "A rental marketplace can help businesses access equipment without purchasing everything themselves.",
  },
];

const sectionReveal = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: "easeOut" },
  },
};

async function getAuthToken() {
  const response = await fetch(`${api}/api/auth/token`, {
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));

  return response.ok && data.token ? data.token : null;
}

export default function Home() {
  const router = useRouter();

  const [equipment, setEquipment] = useState([]);
  const [selected, setSelected] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [auth, setAuth] = useState({
    checked: false,
    token: null,
  });

  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    quantity: 1,
    contactNumber: "",
    deliveryAddress: "",
    additionalNotes: "",
  });

  useEffect(() => {
    let active = true;

    const loadEquipment = async () => {
      try {
        const response = await fetch(
          `${api}/api/equipment?page=1&limit=6`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Could not load equipment."
          );
        }

        if (active) {
          setEquipment(data.data || []);
        }
      } catch (cause) {
        if (active) setError(cause.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    const checkAuthentication = async () => {
      try {
        const token = await getAuthToken();

        if (active) {
          setAuth({ checked: true, token });
        }
      } catch {
        if (active) {
          setAuth({ checked: true, token: null });
        }
      }
    };

    loadEquipment();
    checkAuthentication();

    return () => {
      active = false;
    };
  }, []);

  const redirectToLogin = (returnTo) => {
    router.push(
      `/sign-in?returnTo=${encodeURIComponent(returnTo)}`
    );
  };

  const requireCustomerSession = async (returnTo) => {
    const token = auth.token || await getAuthToken();

    if (!token) {
      redirectToLogin(returnTo);
      return null;
    }

    setAuth({ checked: true, token });

    return token;
  };

  const viewDetails = async (item) => {
    const path = `/equipment/${item._id}`;

    const token = await requireCustomerSession(path);

    if (!token) return;

    router.push(path);
  };

  const openBooking = async (item) => {
    const token = await requireCustomerSession(
      `/equipment/${item._id}`
    );

    if (!token) return;

    setSelected(item);
    setError("");
  };

  const book = async (event) => {
    event.preventDefault();

    if (!selected) return;

    setError("");
    setSubmitting(true);

    try {
      const token = await requireCustomerSession(
        `/equipment/${selected._id}`
      );

      if (!token) {
        setSubmitting(false);
        return;
      }

      const response = await fetch(
        `${api}/api/payments/checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            equipmentId: selected._id,
            ...form,
            quantity: Number(form.quantity),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.checkout?.url) {
        throw new Error(
          data.message || "Unable to start checkout."
        );
      }

      window.location.assign(data.checkout.url);
    } catch (cause) {
      setError(cause.message);
      setSubmitting(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${api}/api/auth/sign-out`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setAuth({ checked: true, token: null });
      router.push("/");
      router.refresh();
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="home-page">

      {/* NAVIGATION */}
      <header className="home-header">
        <Link href="/" className="home-brand">
          EquipRent<span>.</span>
        </Link>

        <nav className="home-navigation">
          <Link href="/" className="active">
            Home
          </Link>

          <Link href="/equipment">
            All Equipment
          </Link>

          <a href="#how-it-works">
            How it works
          </a>

          <a href="#about">
            About us
          </a>
        </nav>

        <div className="home-nav-actions">
          {auth.token ? (
            <>
              <Link
                href="/dashboard"
                className="nav-dashboard"
              >
                Dashboard
              </Link>

              <button
                className="nav-login"
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="nav-login">
                Login
              </Link>

              <Link
                href="/register"
                className="nav-register"
              >
                Get started <span>↗</span>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* HERO / BANNER */}
      <section className="home-hero">
        <motion.div
          className="hero-content"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0, y: 35 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                staggerChildren: 0.13,
                duration: 0.7,
              },
            },
          }}
        >
          <motion.p
            className="home-eyebrow hero-eyebrow"
            variants={sectionReveal}
          >
            THE EQUIPMENT RENTAL MARKETPLACE
          </motion.p>

          <motion.h1 variants={sectionReveal}>
            Make every
            <br />
            project <em>possible.</em>
          </motion.h1>

          <motion.p
            className="hero-description"
            variants={sectionReveal}
          >
            From powerful machinery to creative equipment,
            find what you need, when you need it.
            Rent smarter with EquipRent.
          </motion.p>

          <motion.div
            className="hero-actions"
            variants={sectionReveal}
          >
            <Link href="/equipment" className="home-primary-button">
              Explore equipment <span>↗</span>
            </Link>

            <a href="#how-it-works" className="hero-text-link">
              Discover how it works ↓
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero-floating-card"
          initial={{ opacity: 0, x: 35 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
        >
          <span className="floating-label">
            RENTAL OPTIONS
          </span>

          <div className="floating-periods">
            <span>DAILY</span>
            <span>WEEKLY</span>
            <span>MONTHLY</span>
          </div>

          <p>
            The right equipment.
            <br />
            The right rental period.
          </p>

          <span className="floating-arrow">↗</span>
        </motion.div>

        <div className="hero-bottom-note">
          <span>01 / FIND</span>
          <span>02 / RESERVE</span>
          <span>03 / GET TO WORK</span>
        </div>
      </section>

      {/* FEATURED EQUIPMENT */}
      <section id="featured" className="home-section featured-section">
        <div className="home-section-heading">
          <div>
            <p className="home-eyebrow">CURATED FOR YOUR NEXT PROJECT</p>
            <h2>Featured equipment<span>.</span></h2>
            <p className="section-description">
              Explore equipment currently approved and available
              on our marketplace.
            </p>
          </div>

          <Link href="/equipment" className="home-outline-link">
            View all equipment ↗
          </Link>
        </div>

        {error && !equipment.length && (
          <div className="home-notice">{error}</div>
        )}

        {loading ? (
          <div className="home-loading">
            Loading featured equipment...
          </div>
        ) : equipment.length === 0 ? (
          <div className="home-loading">
            No approved equipment is available right now.
          </div>
        ) : (
          <motion.div
            className="home-equipment-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.12 },
              },
            }}
          >
            {equipment.slice(0, 6).map((item, index) => (
              <motion.article
                className="home-equipment-card"
                key={item._id}
                variants={sectionReveal}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25 }}
              >
                <div
                  className="home-equipment-image"
                  style={
                    item.image
                      ? {
                          backgroundImage: `url("${item.image}")`,
                        }
                      : undefined
                  }
                >
                  <span className="equipment-index">
                    0{index + 1}
                  </span>

                  <span className="equipment-availability">
                    Available · {item.availableQuantity ?? 1}
                  </span>
                </div>

                <div className="home-equipment-body">
                  <p className="equipment-meta">
                    {item.category} <span>·</span> {item.location}
                  </p>

                  <h3>{item.name}</h3>

                  <p className="equipment-description">
                    {item.description}
                  </p>

                  <div className="home-card-footer">
                    <div className="equipment-price">
                      <strong>
                        ৳{item.rentalPrice ?? item.pricePerDay}
                      </strong>

                      <span>
                        / {item.rentalType || "daily"}
                      </span>
                    </div>

                    <button
                      className="equipment-view-button"
                      onClick={() => viewDetails(item)}
                      disabled={!auth.checked}
                    >
                      View details ↗
                    </button>
                  </div>

                  <button
                    className="equipment-book-button"
                    onClick={() => openBooking(item)}
                    disabled={!auth.checked}
                  >
                    Book this equipment
                  </button>
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="home-section categories-section">
        <div className="home-section-heading">
          <div>
            <p className="home-eyebrow">EXPLORE BY CATEGORY</p>
            <h2>What are you looking for<span>?</span></h2>
            <p className="section-description">
              Find the right equipment for every kind of work.
            </p>
          </div>
        </div>

        <motion.div
          className="home-category-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.1 },
            },
          }}
        >
          {categories.map((category) => (
            <motion.div
              key={category.number}
              variants={sectionReveal}
              whileHover={{ y: -5 }}
            >
              <Link
                href={`/equipment?category=${encodeURIComponent(category.name)}`}
                className="home-category-card"
              >
                <div className="category-top">
                  <span>{category.number}</span>
                  <span className="category-arrow">↗</span>
                </div>

                <div className="category-icon">
                  {category.icon}
                </div>

                <h3>{category.name}</h3>

                <p>{category.description}</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* WHY CHOOSE US */}
      <section id="about" className="home-benefits-section">
        <div className="benefits-intro">
          <p className="home-eyebrow">WHY EQUIPRENT</p>

          <h2>
            Better access.
            <br />
            <em>Smarter decisions.</em>
          </h2>

          <p>
            We bring equipment owners and customers together
            through a marketplace designed to make renting
            straightforward and transparent.
          </p>
        </div>

        <div className="benefits-grid">
          {benefits.map((benefit) => (
            <article
              className="benefit-card"
              key={benefit.number}
            >
              <div className="benefit-top">
                <span>{benefit.number}</span>
                <span className="benefit-icon">
                  {benefit.icon}
                </span>
              </div>

              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS - EXTRA SECTION 1 */}
      <section id="how-it-works" className="home-section how-section">
        <div className="home-section-heading">
          <div>
            <p className="home-eyebrow">SIMPLE BY DESIGN</p>
            <h2>Three steps. One smarter rental.</h2>
          </div>
        </div>

        <div className="how-grid">
          {steps.map((step) => (
            <article className="how-card" key={step.number}>
              <span className="how-number">{step.number}</span>
              <div className="how-line" />
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CUSTOMER REVIEWS */}
      <section className="home-section reviews-section">
        <div className="home-section-heading">
          <div>
            <p className="home-eyebrow">RENTERS&apos; PERSPECTIVE</p>
            <h2>Experiences that matter<span>.</span></h2>
            <p className="section-description">
              Examples of the experiences EquipRent aims to deliver.
            </p>
          </div>
        </div>

        <div className="reviews-grid">
          {reviews.map((review) => (
            <article className="review-card" key={review.initials}>
              <div className="review-stars">
                {"★".repeat(review.rating)}
              </div>

              <p className="review-quote">
                “{review.quote}”
              </p>

              <div className="review-person">
                <div className="review-avatar">
                  {review.initials}
                </div>

                <div>
                  <strong>{review.name}</strong>
                  <span>{review.role}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="demo-review-note">
          Illustrative demo testimonials, not verified customer submissions.
        </p>
      </section>

      {/* TRUSTED OWNERS - EXTRA SECTION 2 */}
      <section className="home-owner-cta">
        <div>
          <p className="home-eyebrow">FOR EQUIPMENT OWNERS</p>
          <h2>
            Your equipment can
            <br />
            do more.
          </h2>

          <p>
            List your equipment, manage rental requests
            and make your equipment available to customers.
          </p>
        </div>

        <Link href="/sign-in" className="owner-cta-button">
          Explore owner access ↗
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
        <div className="footer-main">
          <div>
            <Link href="/" className="home-brand footer-brand">
              EquipRent<span>.</span>
            </Link>

            <p>
              Equipment access made simpler.
              <br />
              Built for projects of every size.
            </p>
          </div>

          <div className="footer-links">
            <Link href="/">Home</Link>
            <Link href="/equipment">All equipment</Link>
            <Link href="/sign-in">Sign in</Link>
            <a href="#how-it-works">How it works</a>
          </div>

          <div className="footer-contact">
            <span>SECURE RENTAL PAYMENTS</span>
            <strong>Powered by Stripe</strong>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} EquipRent.</span>
          <span>Equipment rental, made practical.</span>
        </div>
      </footer>

      {/* BOOKING MODAL */}
      {selected && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelected(null);
            }
          }}
        >
          <section
            className="booking-modal"
            aria-labelledby="booking-title"
          >
            <button
              className="close-button"
              onClick={() => setSelected(null)}
              aria-label="Close"
            >
              ×
            </button>

            <p className="eyebrow">RESERVE EQUIPMENT</p>

            <h2 id="booking-title">{selected.name}</h2>

            <p className="modal-copy">
              Your rental total is calculated securely by the server.
            </p>

            {error && (
              <p className="notice error">{error}</p>
            )}

            <form onSubmit={book} className="booking-form">
              <label>
                Rental start date
                <input
                  required
                  type="date"
                  min={today}
                  value={form.startDate}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      startDate: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Rental end date
                <input
                  required
                  type="date"
                  min={form.startDate || today}
                  value={form.endDate}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      endDate: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Required quantity
                <input
                  required
                  type="number"
                  min="1"
                  max={selected.availableQuantity ?? 1}
                  value={form.quantity}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      quantity: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Contact number
                <input
                  required
                  type="tel"
                  minLength="6"
                  maxLength="30"
                  value={form.contactNumber}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      contactNumber: event.target.value,
                    })
                  }
                />
              </label>

              <label className="full-width">
                Delivery address
                <textarea
                  required
                  minLength="5"
                  maxLength="500"
                  rows="2"
                  value={form.deliveryAddress}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      deliveryAddress: event.target.value,
                    })
                  }
                />
              </label>

              <label className="full-width">
                Additional notes{" "}
                <span className="optional">(optional)</span>
                <textarea
                  maxLength="1000"
                  rows="2"
                  value={form.additionalNotes}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      additionalNotes: event.target.value,
                    })
                  }
                />
              </label>

              <button
                className="submit-button full-width"
                disabled={submitting}
              >
                {submitting
                  ? "Preparing secure checkout…"
                  : "Continue to secure payment"}
                <span>→</span>
              </button>
            </form>

            <p className="secure-note">
              Your booking is created only after Stripe confirms payment.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}