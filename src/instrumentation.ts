export async function register() {
  // Reserved for provider-specific monitoring initialization.
}

export function onRequestError(error: unknown, request: { path: string }, context: { routePath: string }) {
  console.error("Server request error", {
    error,
    path: request.path,
    route: context.routePath,
  });
}
