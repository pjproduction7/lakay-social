import '../src/index.css';

export const metadata = {
  title: 'Lakay Social',
  description: 'Community hub for the Haitian diaspora'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
