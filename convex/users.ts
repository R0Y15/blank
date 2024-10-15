import { ConvexError, v } from "convex/values";
import { internalMutation, MutationCtx, QueryCtx } from "./_generated/server";
import { roles } from "./schema";

export async function getUser(ctx: QueryCtx | MutationCtx, tokenIdentifier: string) {
    const user = await ctx.db.query("users").withIndex("by_tokenIdentifier", q => q.eq("tokenIdentifier", tokenIdentifier)).first();

    if (!user) {
        throw new ConvexError("User not found");
    }

    return user;
}

export const createUser = internalMutation({
    args: { tokenIdentifier: v.string() },
    async handler(ctx, args) {
        await ctx.db.insert("users", {
            tokenIdentifier: args.tokenIdentifier,
            orgIds: [],
        });
    }
})

export const addOrgIdToUser = internalMutation({
    args: { tokenIdentifier: v.string(), orgId: v.string(), role: roles },

    async handler(ctx, args) {
        const user = await getUser(ctx, args.tokenIdentifier);

        await ctx.db.patch(user._id, {
            orgIds: [...user.orgIds, { orgId: args.orgId, role: args.role }],
        })
    }
})

export const updateRoleInOrgForUser = internalMutation({
    args: { tokenIdentifier: v.string(), orgId: v.string(), role: roles },

    async handler(ctx, args) {
        const user = await getUser(ctx, args.tokenIdentifier);

        const org = user.orgIds.find((org) => org.orgId === args.orgId);
        if (!org) {
            throw new ConvexError("User not in organization");
        }
        org.role = args.role;

        await ctx.db.patch(user._id, {
            orgIds: user.orgIds,
        })
    }
})
