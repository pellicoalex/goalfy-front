
export type BackendResponse<T> = {
    success: true,
    timestamp: string,
    data: T,
} | {
    success: false,
    timestamp: string,
    message: string
}

export async function myFetch<T>(input: RequestInfo | URL, init?: RequestInit) {
    try {
        const res = await fetch(input, init);
        const resJson: BackendResponse<T> = await res.json();
        if (!resJson.success) {
            throw new Error(resJson.message);
        }
        return resJson.data
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Errore generico');
    }
}