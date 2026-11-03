namespace RouteWise.Api.Exceptions
{
    /// <summary>
    /// The user's input is the problem (unknown algorithm, address not found...).
    /// Safe to show the message to the user and answer with HTTP 400.
    /// Any other exception is treated as our bug and returned as a generic 500.
    /// </summary>
    public class UserInputException : Exception
    {
        public UserInputException(string message) : base(message)
        {
        }
    }
}