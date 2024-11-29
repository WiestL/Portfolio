using Microsoft.AspNetCore.Http;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectPortfolio.Services
{
    public class DateTimeMiddleWare
    {
        private readonly RequestDelegate _next;

        public DateTimeMiddleWare(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Create a mutable collection for the query string
            var queryDictionary = Microsoft.AspNetCore.WebUtilities.QueryHelpers.ParseQuery(context.Request.QueryString.Value);

            foreach (var key in queryDictionary.Keys.ToList())
            {
                var values = queryDictionary[key].ToList();
                for (int i = 0; i < values.Count; i++)
                {
                    if (DateTime.TryParse(values[i], out var parsedDate))
                    {
                        // Convert to UTC and update the value
                        values[i] = DateTime.SpecifyKind(parsedDate, DateTimeKind.Utc).ToString("o");
                    }
                }

                queryDictionary[key] = new Microsoft.Extensions.Primitives.StringValues(values.ToArray());
            }

            // Rebuild the query string and update the request
            var newQueryString = Microsoft.AspNetCore.WebUtilities.QueryHelpers.AddQueryString("", queryDictionary);
            context.Request.QueryString = new QueryString(newQueryString);

            // Call the next middleware in the pipeline
            await _next(context);
        }
    }
}
