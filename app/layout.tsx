import './globals.css'
import Link from 'next/link'

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>
    <header className="nav"><div className="container navin">
      <Link href="/" className="brand">Hama</Link>
      <nav className="navlinks">
        <Link href="/">Home</Link><Link href="/search">Find a home</Link><Link href="/post">Post your house</Link>
      </nav>
      <Link href="/post" className="btn btn-primary">I'm Moving Out</Link>
    </div></header>
    {children}
  </body></html>
}

