export async function handleApiRequest({ action, method = "GET", session, bodyObject, contentType = "application/json" }) {
  let headers = {
    "Authorization": `Bearer ${session?.user?.accessToken}`
  }

  if(contentType) {
    headers["Content-Type"] = contentType;
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${action}`, {
      method,
      headers,
      body: bodyObject ?? null
    });

    if (!response.ok) {
      return { error: response.status, message: "HTTP error", response };
    }

    return await response.json();
  } catch (error) {
    return { error: "Network error", message: error.message };
  }
}