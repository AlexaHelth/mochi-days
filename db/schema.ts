import { sqliteTable, text, real, integer, primaryKey } from 'drizzle-orm/sqlite-core';
export const profiles = sqliteTable('profiles', {userId:text('user_id').primaryKey(), settings:text('settings').notNull()});
export const entries = sqliteTable('entries', {
 userId:text('user_id').notNull(), day:text('day').notNull(), weight:real('weight'),
 mood:integer('mood'), done:text('done').notNull().default('[]'),
},t=>[primaryKey({columns:[t.userId,t.day]})]);
export const stars = sqliteTable('stars', {
 userId:text('user_id').notNull(), day:text('day').notNull(), action:text('action').notNull(),
},t=>[primaryKey({columns:[t.userId,t.day,t.action]})]);
