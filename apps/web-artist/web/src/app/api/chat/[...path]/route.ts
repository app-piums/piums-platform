import { createProxyHandler } from '@/lib/proxy';

const handlers = createProxyHandler('/chat');

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
