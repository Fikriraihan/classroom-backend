import { relations } from "drizzle-orm";
import { integer, pgTable, timestamp, varchar, text, pgEnum, jsonb, index, unique } from "drizzle-orm/pg-core";
import { user } from "./auth";

const timestamps = {
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
}

export const departments = pgTable('departments', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    code: varchar('code', {length: 50}).notNull().unique(),
    name: varchar('name', {length: 250}).notNull(),
    description: varchar('description', {length: 250}).notNull(),
    ...timestamps,
})

export const subjects = pgTable('subjects', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    departmentId: integer('department_id').notNull().references(() => departments.id, {onDelete: 'restrict'}),
    name: varchar('name', {length: 250}).notNull(),
    code: varchar('code', {length: 50}).notNull().unique(),
    description: varchar('description', {length: 250}).notNull(),
    ...timestamps,
})

export const classStatusEnum = pgEnum('class_status', ['active', 'inactive', 'archived']);

export const classes = pgTable('classes', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    subjectId: integer('subject_id').notNull().references(() => subjects.id, {onDelete: 'cascade'}),
    teacherId: text('teacher_id').notNull().references(() => user.id, {onDelete: 'restrict'}),
    inviteCode: varchar('invite_code', { length: 50 }).notNull().unique(),
    name: varchar('name', {length: 255}).notNull(),
    bannerCldPubId: text('banner_cld_pub_id'),
    bannerUrl: text('banner_url'),
    description: text('description'),
    capacity: integer('capacity').default(50),
    status: classStatusEnum('status').default('active'),
    schedules: jsonb('schedules').$type<any[]>(),
    ...timestamps,
}, (table) => [
    index("classes_subject_id_index").on(table.subjectId),
    index("classes_teacher_id_index").on(table.teacherId)
])

export const enrollments = pgTable('enrollments', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    studentId: text('student_id').notNull().references(() => user.id, {onDelete: 'cascade'}),
    classId: integer('class_id').notNull().references(() => classes.id, {onDelete: 'cascade'}),
    ...timestamps,
}, (table) => [
    unique("enrollments_student_class_unique").on(table.studentId, table.classId),
    index("enrollments_student_id_index").on(table.studentId),
    index("enrollments_class_id_index").on(table.classId)
])

export const departmentRelations = relations(departments, ({ many }) => ({ subjects: many(subjects) }))
export const subjectsRelation = relations(subjects, ({ one, many }) => ({
    department: one(departments,
        {
            fields: [subjects.departmentId],
            references: [departments.id]
        }),
    classes: many(classes)
}))

export const classesRelations = relations(classes, ({ one, many }) => ({
    subject: one(subjects, {
        fields: [classes.subjectId],
        references: [subjects.id]
    }),
    teacher: one(user, {
        fields: [classes.teacherId],
        references: [user.id]
    }),
    enrollments: many(enrollments)
}))

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
    student: one(user, {
        fields: [enrollments.studentId],
        references: [user.id]
    }),
    class: one(classes, {
        fields: [enrollments.classId],
        references: [classes.id]
    })
}))

export type Department = typeof departments.$inferSelect;
export type newDepartment = typeof departments.$inferInsert;

export type Subject = typeof subjects.$inferSelect;
export type newSubjects = typeof subjects.$inferInsert;

export type Class = typeof classes.$inferSelect;
export type newClass = typeof classes.$inferInsert;

export type Enrollment = typeof enrollments.$inferSelect;
export type newEnrollment = typeof enrollments.$inferInsert;