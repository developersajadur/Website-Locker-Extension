import {
  TErrorSources,
  TGenericErrorResponse,
} from '../globalTypes/error.type';

type ZodLikeIssue = {
  path?: Array<string | number>;
  message: string;
};

type ZodLikeError = {
  issues: ZodLikeIssue[];
};

const handleZodError = (err: ZodLikeError): TGenericErrorResponse => {
  const errorSources: TErrorSources = err.issues.map((issue) => {
    const issuePath = Array.isArray(issue?.path) ? issue.path : [];

    return {
      path: issuePath[issuePath.length - 1] ?? '',
      message: issue.message,
    };
  });

  const statusCode = 400;

  return {
    statusCode,
    message: 'Validation Error',
    errorSources,
  };
};

export default handleZodError;
