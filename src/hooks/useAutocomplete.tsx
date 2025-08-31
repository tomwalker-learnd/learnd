import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"

interface UseAutocompleteOptions {
  table: "lessons" | "clients" | "profiles" | "saved_dashboards"
  column: string
  minLength?: number
  debounceMs?: number
}

export function useAutocomplete({
  table,
  column,
  minLength = 1,
  debounceMs = 300,
}: UseAutocompleteOptions) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [allValues, setAllValues] = useState<string[]>([])

  // Fetch all unique values once on mount
  useEffect(() => {
    const fetchAllValues = async () => {
      try {
        const { data, error } = await supabase
          .from(table)
          .select(column)
          .not(column, "is", null)
          .order(column)

        if (error) throw error

        const uniqueValues = Array.from(
          new Set(
            data
              ?.map((item: any) => item[column])
              .filter((value: string) => value && value.trim())
              .map((value: string) => value.trim())
          )
        ).sort()

        setAllValues(uniqueValues)
      } catch (error) {
        console.error("Error fetching autocomplete values:", error)
      }
    }

    fetchAllValues()
  }, [table, column])

  const getSuggestions = useCallback(
    (query: string) => {
      if (!query || query.length < minLength) {
        setSuggestions(allValues.slice(0, 10))
        return
      }

      const filtered = allValues
        .filter((value) =>
          value.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 10)

      setSuggestions(filtered)
    },
    [allValues, minLength]
  )

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [suggestions, debounceMs])

  return {
    suggestions,
    loading,
    getSuggestions,
  }
}