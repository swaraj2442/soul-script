"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/theme-toggle"
import { LogIn, FileText, MessageSquare, Menu, X, User, Loader2 } from "lucide-react"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase/client"

export function HeaderNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(false)
  const [user, setUser] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const getUser = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (data.user) {
          setUser(data.user)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setIsLoading(false)
      }
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <FileText className="h-6 w-6" />
              <span className="hidden font-bold sm:inline-block">
                Soul Script
              </span>
            </Link>
          </div>
          
          {/* Center Navigation */}
          <nav className="hidden md:flex items-center justify-center flex-1 px-8">
            <div className="flex items-center gap-1">
              <Link
                href="/dashboard"
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors rounded-md hover:bg-muted/50",
                  pathname === "/dashboard"
                    ? "text-primary bg-muted/50"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                Dashboard
              </Link>
              <Link
                href="/chat"
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors rounded-md hover:bg-muted/50",
                  pathname === "/chat"
                    ? "text-primary bg-muted/50"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                Chat
              </Link>
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="h-9 px-4">About</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-2">
                        <li className="row-span-3">
                          <NavigationMenuLink asChild>
                            <a
                              className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                              href="/"
                            >
                              <MessageSquare className="h-6 w-6" />
                              <div className="mb-2 mt-4 text-lg font-medium">
                                Soul Script
                              </div>
                              <p className="text-sm leading-tight text-muted-foreground">
                                Intelligent document Q&A powered by AI
                              </p>
                            </a>
                          </NavigationMenuLink>
                        </li>
                        <li>
                          <Link href="/how-it-works" legacyBehavior passHref>
                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                              How It Works
                            </NavigationMenuLink>
                          </Link>
                        </li>
                        <li>
                          <Link href="/faq" legacyBehavior passHref>
                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                              FAQ
                            </NavigationMenuLink>
                          </Link>
                        </li>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </nav>
          
          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            <ModeToggle />
            {isLoading ? (
              <div className="h-9 w-9 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.user_metadata?.avatar_url || ""} alt={user.email || "User"} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || user.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/chat">Chat</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link href="/auth/login">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 px-4 font-medium hover:bg-muted/50"
                  >
                    Log In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button 
                    size="sm" 
                    className="h-9 px-4 font-medium bg-primary hover:bg-primary/90"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="pr-0">
                <div className="flex flex-col gap-4 px-6">
                  <Link 
                    href="/"
                    className="flex items-center gap-2 font-semibold"
                    onClick={() => setIsOpen(false)}
                  >
                    <FileText className="h-5 w-5" />
                    <span>Soul Script</span>
                  </Link>
                  <Separator />
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/dashboard"
                      className={cn(
                        "text-sm font-medium transition-colors hover:text-primary",
                        pathname === "/dashboard"
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/chat"
                      className={cn(
                        "text-sm font-medium transition-colors hover:text-primary",
                        pathname === "/chat"
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      Chat
                    </Link>
                    <Link
                      href="/how-it-works"
                      className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                      onClick={() => setIsOpen(false)}
                    >
                      How It Works
                    </Link>
                    <Link
                      href="/faq"
                      className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                      onClick={() => setIsOpen(false)}
                    >
                      FAQ
                    </Link>
                  </div>
                  <Separator />
                  {user ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 p-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.user_metadata?.avatar_url || ""} alt={user.email || "User"} />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium">{user.user_metadata?.full_name || user.email}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Button variant="ghost" className="w-full justify-start text-red-600" onClick={handleSignOut}>
                        Sign out
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start h-9">
                          <LogIn className="mr-2 h-4 w-4" />
                          Log In
                        </Button>
                      </Link>
                      <Link href="/auth/signup" onClick={() => setIsOpen(false)}>
                        <Button className="w-full h-9">Sign Up</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}