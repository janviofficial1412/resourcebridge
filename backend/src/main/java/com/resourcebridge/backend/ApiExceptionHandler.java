package com.resourcebridge.backend;

import com.resourcebridge.backend.identity.RegistrationService;
import com.resourcebridge.backend.institution.InstitutionService;
import com.resourcebridge.backend.booking.BookingService;
import com.resourcebridge.backend.image.ImageAssetService;
import com.resourcebridge.backend.image.ImageContentValidator;
import com.resourcebridge.backend.resource.ResourceCategoryService;
import com.resourcebridge.backend.resource.ResourceService;
import com.resourcebridge.backend.resource.matching.ResourceMatchService;
import com.resourcebridge.backend.incident.IncidentReportService;
import com.resourcebridge.backend.incident.IncidentSummarizationService;
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

    @ExceptionHandler(InstitutionService.MembershipRequestConflictException.class)
    public ResponseEntity<ApiError> handleMembershipRequestConflict(
            InstitutionService.MembershipRequestConflictException e) {
        return build(HttpStatus.CONFLICT, e.getMessage(), List.of());
    }

    @ExceptionHandler(ResourceService.ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleResourceNotFound(ResourceService.ResourceNotFoundException e) {
        return build(HttpStatus.NOT_FOUND, e.getMessage(), List.of());
    }

    @ExceptionHandler(ResourceService.ResourceAccessDeniedException.class)
    public ResponseEntity<ApiError> handleResourceAccessDenied(ResourceService.ResourceAccessDeniedException e) {
        return build(HttpStatus.FORBIDDEN, e.getMessage(), List.of());
    }

    @ExceptionHandler(ResourceService.ResourceValidationException.class)
    public ResponseEntity<ApiError> handleResourceValidation(ResourceService.ResourceValidationException e) {
        return build(HttpStatus.BAD_REQUEST, e.getMessage(), List.of());
    }

    @ExceptionHandler(ResourceMatchService.MatchValidationException.class)
    public ResponseEntity<ApiError> handleResourceMatchValidation(ResourceMatchService.MatchValidationException e) {
        return build(HttpStatus.BAD_REQUEST, e.getMessage(), List.of());
    }

    @ExceptionHandler(IncidentReportService.IncidentNotFoundException.class)
    public ResponseEntity<ApiError> handleIncidentNotFound(IncidentReportService.IncidentNotFoundException e) {
        return build(HttpStatus.NOT_FOUND, e.getMessage(), List.of());
    }

    @ExceptionHandler(IncidentReportService.IncidentAccessDeniedException.class)
    public ResponseEntity<ApiError> handleIncidentAccessDenied(
            IncidentReportService.IncidentAccessDeniedException e) {
        return build(HttpStatus.FORBIDDEN, e.getMessage(), List.of());
    }

    @ExceptionHandler(IncidentReportService.IncidentValidationException.class)
    public ResponseEntity<ApiError> handleIncidentValidation(
            IncidentReportService.IncidentValidationException e) {
        return build(HttpStatus.BAD_REQUEST, e.getMessage(), List.of());
    }

    @ExceptionHandler(IncidentSummarizationService.IncidentSummarizationUnavailableException.class)
    public ResponseEntity<ApiError> handleIncidentSummarizationUnavailable(
            IncidentSummarizationService.IncidentSummarizationUnavailableException e) {
        return build(HttpStatus.SERVICE_UNAVAILABLE, e.getMessage(), List.of());
    }

    @ExceptionHandler(ResourceCategoryService.DuplicateCategoryException.class)
    public ResponseEntity<ApiError> handleDuplicateCategory(ResourceCategoryService.DuplicateCategoryException e) {
        return build(HttpStatus.CONFLICT, e.getMessage(), List.of());
    }

    @ExceptionHandler(ResourceCategoryService.ResourceCategoryNotFoundException.class)
    public ResponseEntity<ApiError> handleResourceCategoryNotFound(ResourceCategoryService.ResourceCategoryNotFoundException e) {
        return build(HttpStatus.NOT_FOUND, e.getMessage(), List.of());
    }

    @ExceptionHandler(BookingService.BookingNotFoundException.class)
    public ResponseEntity<ApiError> handleBookingNotFound(BookingService.BookingNotFoundException e) {
        return build(HttpStatus.NOT_FOUND, e.getMessage(), List.of());
    }

    @ExceptionHandler(BookingService.BookingAccessDeniedException.class)
    public ResponseEntity<ApiError> handleBookingAccessDenied(BookingService.BookingAccessDeniedException e) {
        return build(HttpStatus.FORBIDDEN, e.getMessage(), List.of());
    }

    @ExceptionHandler(BookingService.BookingValidationException.class)
    public ResponseEntity<ApiError> handleBookingValidation(BookingService.BookingValidationException e) {
        return build(HttpStatus.BAD_REQUEST, e.getMessage(), List.of());
    }

    @ExceptionHandler(BookingService.BookingConflictException.class)
    public ResponseEntity<ApiError> handleBookingConflict(BookingService.BookingConflictException e) {
        return build(HttpStatus.CONFLICT, e.getMessage(), List.of());
    }

    @ExceptionHandler(ImageAssetService.ImageNotFoundException.class)
    public ResponseEntity<ApiError> handleImageNotFound(ImageAssetService.ImageNotFoundException e) {
        return build(HttpStatus.NOT_FOUND, e.getMessage(), List.of());
    }

    @ExceptionHandler(ImageAssetService.ImageAccessDeniedException.class)
    public ResponseEntity<ApiError> handleImageAccessDenied(ImageAssetService.ImageAccessDeniedException e) {
        return build(HttpStatus.FORBIDDEN, e.getMessage(), List.of());
    }

    @ExceptionHandler(ImageContentValidator.InvalidImageException.class)
    public ResponseEntity<ApiError> handleInvalidImage(ImageContentValidator.InvalidImageException e) {
        return build(HttpStatus.BAD_REQUEST, e.getMessage(), List.of());
    }

    @ExceptionHandler(ImageAssetService.ImageStorageException.class)
    public ResponseEntity<ApiError> handleImageStorageFailure() {
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Image storage operation failed", List.of());
    }

    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiError> handleUploadTooLarge() {
        return build(HttpStatus.PAYLOAD_TOO_LARGE, "Image must be no larger than 5 MB", List.of());
    }

    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthenticationException(org.springframework.security.core.AuthenticationException e) {
        return build(HttpStatus.UNAUTHORIZED, e.getMessage(), List.of());
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(org.springframework.security.access.AccessDeniedException e) {
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

    /**
     * Handles invalid enum / UUID query parameters (e.g. resourceType=INVALID).
     * Spring throws MethodArgumentTypeMismatchException before the controller is reached.
     */
    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleTypeMismatch(
            org.springframework.web.method.annotation.MethodArgumentTypeMismatchException e) {
        String param = e.getName();
        String message = "Invalid value for parameter '" + param + "': " + e.getValue();
        return build(HttpStatus.BAD_REQUEST, message, List.of());
    }

    private static ResponseEntity<ApiError> build(HttpStatus status, String message, List<FieldProblem> fieldErrors) {
        ApiError body = new ApiError(status.value(), status.getReasonPhrase(), message, fieldErrors);
        return ResponseEntity.status(status).contentType(MediaType.APPLICATION_JSON).body(body);
    }
}
