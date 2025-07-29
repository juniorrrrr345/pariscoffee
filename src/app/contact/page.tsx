'use client';

import ContactPage from '@/components/ContactPage';

export default function ContactPageRoute() {
  return <ContactPage onClose={() => window.history.back()} />;
}