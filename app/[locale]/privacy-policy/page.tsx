import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
          <p className="text-gray-700">
            This Privacy Policy explains how YK Labs LLC ("we," "our," or "us")
            collects, uses, and protects your information when you use Perfect
            Interview (the "Service").
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">
            2. Information We Collect
          </h2>
          <p className="text-gray-700">
            We collect information that you provide directly to us, including:
          </p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
            <li>Account information (name, email, password)</li>
            <li>Profile information</li>
            <li>Content you create or upload</li>
            <li>Communication preferences</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">
            3. How We Use Your Information
          </h2>
          <p className="text-gray-700">We use the collected information to:</p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
            <li>Provide and maintain the Service</li>
            <li>Improve and personalize your experience</li>
            <li>Communicate with you about the Service</li>
            <li>Ensure security and prevent fraud</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">4. Data Security</h2>
          <p className="text-gray-700">
            We implement appropriate security measures to protect your personal
            information. However, no method of transmission over the Internet is
            100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">
            5. Changes to This Policy
          </h2>
          <p className="text-gray-700">
            We may update this Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">6. Contact Us</h2>
          <p className="text-gray-700">
            If you have any questions about this Privacy Policy, please contact
            us at support@perfectinterview.ai
          </p>
        </section>
      </div>
    </div>
  );
}
