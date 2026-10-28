package com.resourcebridge.backend;

import com.resourcebridge.backend.identity.RegistrationService;
import com.resourcebridge.backend.institution.InstitutionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Comparator;
import java.util.List;

@RestControllerAdvice
public class ApiExceptionHandler {

    /** Every error response has this shape. fieldErrors is an empty list when not applicable. */
    public record ApiError(int status, String error, String message, List<FieldProblem> fieldErrors) {
    }

    /** One validation problem. Deliberately has no field for the rejected value. */
    public record FieldProblem(String field, String message) {
    }

    @ExceptionHandler(RegistrationService.UsernameAlreadyTakenException.class)
    public ResponseEntity<ApiError> handleUsernameAlreadyTaken() {
        return build(HttpStatus.CONFLICT, "An account with this username already exists", List.of());
    }

    @ExceptionHandler(RegistrationService.EmailAlreadyRegisteredException.class)
    public ResponseEntity<ApiError> handleEmailAlreadyRegistered() {
        return build(HttpStatus.CONFLICT, "An account with this email already exists", List.of());
    }

    @ExceptionHandler(InstitutionService.DuplicateInstitutionSlugException.class)
    public ResponseEntity<ApiError> handleDuplicateInstitutionSlug() {
        return build(HttpStatus.CONFLICT, "An institution with this slug already exists", List.of());
    }

    @ExceptionHandler(InstitutionService.InstitutionNotFoundException.class)
    public ResponseEntity<ApiError> handleInstitutionNotFound(InstitutionService.InstitutionNotFoundException e) {
        return build(HttpStatus.NOT_FOUND, e.getMessage(), List.of());
    }

    @ExceptionHandler(InstitutionService.InstitutionAccessDeniedException.class)
    public ResponseEntity<ApiError> handleInstitutionAccessDenied(InstitutionService.InstitutionAccessDeniedException e) {
        return build(HttpStatus.FORBIDDEN, e.getMessage(), List.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException e) {
        List<FieldProblem> problems = e.getBindingResult().getFieldErrors().stream()
                .map(fe -> new FieldProblem(
                        fe.getField(),
                        fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "is invalid"))
                .sorted(Comparator.comparing(FieldProblem::field).thenComparing(FieldProblem::message))
                .toList();
        return build(HttpStatus.BAD_REQUEST, "Validation failed", problems);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleUnreadableBody() {
        return build(HttpStatus.BAD_REQUEST, "Request body is missing or is not valid JSON", List.of());
    }

    private static ResponseEntity<ApiError> build(HttpStatus status, String message, List<FieldProblem> fieldErrors) {
        ApiError body = new ApiError(status.value(), status.getReasonPhrase(), message, fieldErrors);
        return ResponseEntity.status(status).contentType(MediaType.APPLICATION_JSON).body(body);
    }
}
