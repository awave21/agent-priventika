/**
 * Прямые HTTP запросы к Supabase REST API
 */
export async function supabaseFetch<T = any>(
  url: string,
  anonKey: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: any }> {
  if (!url || !url.startsWith('http')) {
    const error = `[supabaseFetch] Некорректный Supabase URL: "${url}". URL должен начинаться с https://`
    console.error(error)
    return { data: null, error: { message: error } }
  }

  if (!anonKey) {
    const error = '[supabaseFetch] Отсутствует Supabase Anon Key'
    console.error(error)
    return { data: null, error: { message: error } }
  }

  const fullUrl = `${url}/rest/v1/${endpoint}`
  console.log(`[supabaseFetch] ${options.method || 'GET'} ${fullUrl}`)

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    console.log(`[supabaseFetch] Response: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const error = await response.json()
      console.error(`[supabaseFetch] Ошибка ${response.status}:`, error)
      return { data: null, error }
    }

    // 204 No Content не имеет тела
    if (response.status === 204) {
      return { data: null, error: null }
    }

    const data = await response.json()
    return { data, error: null }
  } catch (error) {
    console.error(`[supabaseFetch] Сетевая ошибка при запросе к ${endpoint}:`, error)
    console.error(`[supabaseFetch] Полный URL: ${fullUrl}`)
    console.error(`[supabaseFetch] Проверьте: 1) Supabase URL настроен правильно, 2) CORS разрешён, 3) Интернет доступен`)
    return { data: null, error }
  }
}
