"use client"

import { Input } from "@/components/ui/input"
import { useState } from "react"
import { SearchIcon } from 'lucide-react'

export function Search() {
  const [search, setSearch] = useState("")

  return (
    <div className="relative">
      <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search..."
        className="pl-8 w-[200px] md:w-[300px]"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  )
}

