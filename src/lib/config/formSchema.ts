import { z } from 'zod';
import {
	min_length_required,
	special_char_required,
	lowecase_required,
	uppercase_required,
	number_required,
	must_match,
	required,
	password,
	form_sub_title,
	must_be_a_number,
	must_be_greater_than_0
} from '$paraglide/messages';
const FIELDS = form_sub_title().split('|');
const MIN_LENGTH = 6;
const FIELD_VALIDATION = {
	TEST: {
		SPECIAL_CHAR: (value: string) => /[-._!"`'#%&,:;<>=@{}~\$\(\)\*\+\/\\\?\[\]\^\|]+/.test(value),
		LOWERCASE: (value: string) => /[a-z]/.test(value),
		UPPERCASE: (value: string) => /[A-Z]/.test(value),
		NUMBER: (value: string) => /.*[0-9].*/.test(value)
	},
	MSG: {
		MIN_LEN: min_length_required({
			input: password(),
			minLength: MIN_LENGTH
		}),
		SPECIAL_CHAR: special_char_required({ input: password() }),
		LOWERCASE: lowecase_required({ input: password() }),
		UPPERCASE: uppercase_required({ input: password() }),
		NUMBER: number_required({ input: password() }),
		MATCH: must_match({ input: password() })
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
	date: z.string().refine((v) => v, { message: required({ input: FIELDS[0] }) }),
	balance: z
		.string()
		.refine(FIELD_VALIDATION.TEST.NUMBER, must_be_a_number({ input: FIELDS[1] }))
		.refine((value) => Number(value) > 0, {
			message: must_be_greater_than_0({ input: FIELDS[1] })
		}),
	totalKwh: z
		.string()
		.refine(FIELD_VALIDATION.TEST.NUMBER, must_be_a_number({ input: FIELDS[2] }))
		.refine((value) => Number(value) > 0, {
			message: must_be_greater_than_0({ input: FIELDS[2] })
		}),
	subReading: z
		.string()
		.refine(FIELD_VALIDATION.TEST.NUMBER, must_be_a_number({ input: FIELDS[3] }))
		.refine((value) => Number(value) > 0, {
			message: must_be_greater_than_0({ input: FIELDS[3] })
		})
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
