class ApiResponses<T> {
    public success: boolean;
   constructor(public statusCode: number, public data: T, public message: string) {
      this.statusCode = statusCode;
      this.data = data;
      this.message = message || "Success";
      this.success = statusCode < 400;
   }
}

export { ApiResponses };