using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using ProjectPortfolio.Contexts;
using ProjectPortfolio.Models;
using ProjectPortfolio.Services;
using System.Text.Json.Serialization;
using Npgsql.EntityFrameworkCore.PostgreSQL;


var builder = WebApplication.CreateBuilder(args);

// Add configuration from appsettings.json and environment variables
builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                      .AddEnvironmentVariables();

// Add services to the container.
builder.Services.AddControllersWithViews();

// Add Razor Pages
builder.Services.AddRazorPages();
builder.Services.AddTransient<IEmailSender, DummyEmailSender>();
// Configure JSON options
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.Preserve;
});

// Configure Entity Framework with Render
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));


// Configure Identity with custom User class and roles
builder.Services.AddIdentity<User, IdentityRole>(options =>
{
    options.SignIn.RequireConfirmedAccount = false;
    // Additional Identity options can be configured here
})
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// Configure application cookies
builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/Identity/Account/Login";
    options.AccessDeniedPath = "/Identity/Account/AccessDenied";
});

var app = builder.Build();
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";

app.Urls.Add($"http://0.0.0.0:{port}");
// Seed roles and admin user
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var userManager = services.GetRequiredService<UserManager<User>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        await SeedRolesAndAdminUser(userManager, roleManager);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding roles and users.");
    }
}
app.UseStaticFiles(new StaticFileOptions
{
    ServeUnknownFileTypes = true, // Allow serving unknown file types
    DefaultContentType = "application/octet-stream", // Set default content type if MIME type is unknown
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "wwwroot")
    ),
    OnPrepareResponse = ctx =>
    {
        if (ctx.File.Name.EndsWith(".glb"))
        {
            ctx.Context.Response.ContentType = "model/gltf-binary"; // Set MIME type for .glb files
        }
    }
});

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();


app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

// Configure endpoint routing
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.MapRazorPages();

app.Run();

// Seeding method to create roles and admin user
async Task SeedRolesAndAdminUser(UserManager<User> userManager, RoleManager<IdentityRole> roleManager)
{
    // Create Admin role if it doesn't exist
    if (!await roleManager.RoleExistsAsync("Admin"))
    {
        await roleManager.CreateAsync(new IdentityRole("Admin"));
    }

    // Create Admin user if it doesn't exist
    var adminUser = await userManager.FindByEmailAsync("admin@example.com");
    if (adminUser == null)
    {
        adminUser = new User
        {
            UserName = "admin@example.com",
            Email = "admin@example.com",
            EmailConfirmed = true
        };
        await userManager.CreateAsync(adminUser, "AdminPassword123!");
        await userManager.AddToRoleAsync(adminUser, "Admin");
    }
}
