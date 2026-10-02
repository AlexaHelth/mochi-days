import { sqliteTable, text, real, integer, primaryKey } from 'drizzle-orm/sqlite-core';
export const profiles = sqliteTable('profiles', {userId:text('user_id').primaryKey(), settings:text('settings').notNull()});
export const entries = sqliteTable('entries', {
 userId:text('user_id').notNull(), day:text('day').notNull(), weight:real('weight'), walkingMinutes:integer('walking_minutes'),
 mood:integer('mood'), note:text('note').notNull().default(''), done:text('done').notNull().default('[]'), care:text('care').notNull().default('{}'), partial:text('partial').notNull().default('[]'), feelings:text('feelings').notNull().default('[]'), tags:text('tags').notNull().default('[]'),
},t=>[primaryKey({columns:[t.userId,t.day]})]);
export const stars = sqliteTable('stars', {
 userId:text('user_id').notNull(), day:text('day').notNull(), action:text('action').notNull(),
},t=>[primaryKey({columns:[t.userId,t.day,t.action]})]);
export const companions=sqliteTable('companions',{userId:text('user_id').primaryKey(),state:text('state').notNull(),revision:integer('revision').notNull().default(0)});
