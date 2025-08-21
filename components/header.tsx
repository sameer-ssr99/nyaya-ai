"use client"

import { Button } from "@/components/ui/button"
import { Scale, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useI18n } from "@/lib/i18n/context"
import Link from "next/link"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const { t } = useI18n()
  const supabase = createClient()

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const navItems = user
    ? [
        { label: t("nav.knowYourRights"), href: "/kyr" },
        { label: t("nav.aiAssistant"), href: "/chat" },
        { label: t("nav.documents"), href: "/documents" },
        { label: t("nav.stories"), href: "/stories" }, // Added stories navigation
        { label: t("nav.dashboard"), href: "/dashboard" },
        { label: t("nav.findLawyers"), href: "/lawyers" },
      ]
    : [
        { label: t("nav.features"), href: "#features" },
        { label: t("nav.howItWorks"), href: "#how-it-works" },
        { label: t("nav.about"), href: "#about" },
        { label: t("nav.contact"), href: "#contact" },
      ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <Link href="/" className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <Scale className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-serif font-bold text-foreground">Nyaya.ai</span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Desktop CTA */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex items-center gap-4"
          >
            <LanguageSwitcher />
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {t("auth.welcome")}, {user.user_metadata?.full_name || user.email}
                </span>
                <Button variant="ghost" onClick={handleSignOut}>
                  {t("auth.signOut")}
                </Button>
              </div>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">{t("auth.signIn")}</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button>{t("auth.getStarted")}</Button>
                </Link>
              </>
            )}
          </motion.div>

          {/* Mobile Menu Button */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-foreground">
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border/50 py-4"
            >
              <nav className="flex flex-col gap-4">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors duration-200 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                  <div className="py-2">
                    <LanguageSwitcher />
                  </div>
                  {user ? (
                    <>
                      <span className="text-sm text-muted-foreground py-2">
                        {t("auth.welcome")}, {user.user_metadata?.full_name || user.email}
                      </span>
                      <Button variant="ghost" className="justify-start" onClick={handleSignOut}>
                        {t("auth.signOut")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/auth/login">
                        <Button variant="ghost" className="justify-start">
                          {t("auth.signIn")}
                        </Button>
                      </Link>
                      <Link href="/auth/signup">
                        <Button className="justify-start">{t("auth.getStarted")}</Button>
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
