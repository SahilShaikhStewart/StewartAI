namespace StewartAI.Domain.Exceptions;

/// <summary>
/// Base exception for business logic errors.
/// </summary>
public class BusinessException : Exception
{
    public BusinessException(string message) : base(message) { }
    public BusinessException(string message, Exception innerException) : base(message, innerException) { }
}
