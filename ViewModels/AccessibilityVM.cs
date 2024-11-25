// ViewModels/AccessibilityVM.cs

using ProjectPortfolio.Models;
using System.Collections.Generic;

namespace ProjectPortfolio.ViewModels
{
    public class AccessibilityVM
    {
        public List<Skill> Skills { get; set; }
        public List<Category> Categories { get; set; }
        public List<Project> Projects { get; set; }
    }
}
