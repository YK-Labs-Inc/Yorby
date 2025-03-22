import React from "react";

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">1. Agreement to Terms</h2>
          <p className="text-gray-700">
            By accessing or using Perfect Interview (the "Service") provided by
            YK Labs LLC ("we," "our," or "us"), you agree to be bound by these
            Terms of Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">
            2. Description of Service
          </h2>
          <p className="text-gray-700">
            Perfect Interview is an AI-powered interview preparation platform
            that provides interview practice and feedback. We reserve the right
            to modify, suspend, or discontinue any aspect of the Service at any
            time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">3. User Accounts</h2>
          <p className="text-gray-700">You are responsible for:</p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
            <li>Maintaining the confidentiality of your account</li>
            <li>All activities that occur under your account</li>
            <li>Providing accurate and complete information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">4. Acceptable Use</h2>
          <p className="text-gray-700">You agree not to:</p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
            <li>Use the Service for any illegal purpose</li>
            <li>Share your account with others</li>
            <li>Attempt to gain unauthorized access to the Service</li>
            <li>Interfere with or disrupt the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">
            5. Intellectual Property
          </h2>
          <p className="text-gray-700">
            All content and materials available through the Service are the
            property of YK Labs LLC or its licensors and are protected by
            intellectual property laws.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">
            6. Disclaimer of Warranties
          </h2>
          <p className="text-gray-700">
            The Service is provided "as is" without any warranties, express or
            implied. We do not guarantee that the Service will be uninterrupted
            or error-free.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">
            7. Limitation of Liability
          </h2>
          <p className="text-gray-700">
            YK Labs LLC shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages resulting from your use
            of or inability to use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">8. Changes to Terms</h2>
          <p className="text-gray-700">
            We reserve the right to modify these Terms at any time. Continued
            use of the Service after any modifications indicates your acceptance
            of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">9. Contact Information</h2>
          <p className="text-gray-700">
            For questions about these Terms, please contact us at
            support@perfectinterview.ai
          </p>
        </section>
      </div>
    </div>
  );
}
