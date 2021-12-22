function FetchError(response, message, responseText, responseJson) {
    this.name = "FetchError";
    this.message = (message || response.statusText || "");
    this.response = response;
    this.status = response.status;
    this.responseText = responseText;
    this.responseJson = responseJson;
}

FetchError.prototype = Error.prototype;

export default FetchError;
