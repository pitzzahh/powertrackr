import { z } from 'zod';

const MAX_FILE_SIZE = 500000;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MIN_LENGTH = 6;
const FIELD_VALIDATION = {
	TEST: {
		SPECIAL_CHAR: (value: string) => /[-._!"`'#%&,:;<>=@{}~\$\(\)\*\+\/\\\?\[\]\^\|]+/.test(value),
		LOWERCASE: (value: string) => /[a-z]/.test(value),
		UPPERCASE: (value: string) => /[A-Z]/.test(value),
		NUMBER: (value: string) => /.*[0-9].*/.test(value)
	},
	MSG: {
		MIN_LEN: `Password must have ${MIN_LENGTH} characters`,
		SPECIAL_CHAR: 'Password must contain atleast one special character',
		LOWERCASE: 'Password must contain at least one lowercase letter',
		UPPERCASE: 'Password must contain at least one uppercase letter',
		NUMBER: 'Password must contain at least one number',
		MATCH: 'Password must match'
	}
};

export const registerFormSchema = z
	.object({
		username: z.string().min(2).max(50),
		name: z.string(),
		password: z
			.string()
			.min(MIN_LENGTH, {
				message: FIELD_VALIDATION.MSG.MIN_LEN
			})
			.refine(FIELD_VALIDATION.TEST.SPECIAL_CHAR, FIELD_VALIDATION.MSG.SPECIAL_CHAR)
			.refine(FIELD_VALIDATION.TEST.LOWERCASE, FIELD_VALIDATION.MSG.LOWERCASE)
			.refine(FIELD_VALIDATION.TEST.UPPERCASE, FIELD_VALIDATION.MSG.UPPERCASE)
			.refine(FIELD_VALIDATION.TEST.NUMBER, FIELD_VALIDATION.MSG.NUMBER),
		confirmPassword: z.string().min(MIN_LENGTH)
	})
	.superRefine(({ confirmPassword, password }, ctx) => {
		if (confirmPassword !== password) {
			addFieldIssue('password', ctx);
			addFieldIssue('confirmPassword', ctx);
		}
	});

const addFieldIssue = (field: string, ctx: { addIssue: any; path?: (string | number)[] }) => {
	ctx.addIssue({
		code: 'custom',
		message: FIELD_VALIDATION.MSG.MATCH,
		path: [field],
		fatal: true
	});
};

export const loginFormSchema = z.object({
	username: z.string().min(2).max(50),
	password: z.string().min(MIN_LENGTH, {
		message: FIELD_VALIDATION.MSG.MIN_LEN
	})
});

export const billFormSchema = z.object({
	date: z.string().refine((v) => v, { message: 'A date of bill is required.' }),
	balance: z
		.string()
		.refine(FIELD_VALIDATION.TEST.NUMBER, 'Balance must be a number')
		.refine((value) => Number(value) > 0, { message: 'Balance must be greater than 0' }),
	totalKwh: z
		.string()
		.refine(FIELD_VALIDATION.TEST.NUMBER, 'Total Kwh must be a number')
		.refine((value) => Number(value) > 0, { message: 'Total Kwh must be greater than 0' }),
	subReading: z
		.string()
		.refine(FIELD_VALIDATION.TEST.NUMBER, 'SubReading must be a number')
		.refine((value) => Number(value) > 0, { message: 'SubReading must be greater than 0' })
		.optional(),
	status: z.boolean()
});

export const profileFormSchema = z.object({
	avatar: z.string().optional()
});

export type RegisterFormSchema = typeof registerFormSchema;
export type LoginFormSchema = typeof loginFormSchema;
export type BillFormSchema = typeof billFormSchema;
export type ProfileFormSchema = typeof profileFormSchema;
