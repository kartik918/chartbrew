const ProjectController = require("../controllers/ProjectController");
const TeamController = require("../controllers/TeamController");
const verifyToken = require("../modules/verifyToken");
const accessControl = require("../modules/accessControl");

module.exports = (app) => {
  const projectController = new ProjectController();
  const teamController = new TeamController();

  /*
  ** [MASTER] Route to get all the projects
  */
  app.get("/project", verifyToken, (req, res) => {
    if (!req.user.admin) {
      return res.status(401).send({ error: "Not authorized" });
    }

    return projectController.findAll()
      .then((projects) => {
        return res.status(200).send(projects);
      })
      .catch((error) => {
        return res.status(400).send(error);
      });
  });
  // -----------------------------------------

  /*
  ** Route to create a project
  */
  app.post("/project", verifyToken, (req, res) => {
    return teamController.getTeamRole(req.body.team_id, req.user.id)
      .then((teamRole) => {
        const permission = accessControl.can(teamRole.role).createAny("project");
        if (!permission.granted) {
          throw new Error(401);
        }

        return projectController.create(req.user.id, req.body);
      })
      .then((project) => {
        return res.status(200).send(project);
      })
      .catch((error) => {
        if (error.message.indexOf("401") > -1) {
          return res.status(401).send({ error: "Not authorized" });
        }
        return res.status(400).send(error);
      });
  });
  // -----------------------------------------

  /*
  ** Route to get all the user's projects
  ** TODO: MODIFY ACCORDNG TO NEW TEAM ROLE CHANGES
  */
  app.get("/project", verifyToken, (req, res) => {
    projectController.findByUserId(req.user.id)
      .then((projects) => {
        return res.status(200).send(projects);
      })
      .catch((error) => {
        return res.status(400).send(error);
      });
  });
  // -----------------------------------------

  /*
  ** Route to get a project by ID
  */
  app.get("/project/:id", verifyToken, (req, res) => {
    let gProject;
    return projectController.findById(req.params.id)
      .then((project) => {
        gProject = project;
        return teamController.getTeamRole(project.team_id, req.user.id);
      })
      .then((teamRole) => {
        const permission = accessControl.can(teamRole.role).readAny("project");
        if (!permission.granted) {
          throw new Error(401);
        }

        return res.status(200).send(gProject);
      })
      .catch((error) => {
        if (error.message === "401") {
          return res.status(401).send({ error: "Not authorized" });
        }
        if (error.message === "404") {
          return res.status(404).send({ error: "Not Found" });
        }
        return res.status(400).send(error);
      });
  });
  // -----------------------------------------

  /*
  ** Route to update a project ID
  */
  app.put("/project/:id", verifyToken, (req, res) => {
    return projectController.findById(req.params.id)
      .then((project) => {
        return teamController.getTeamRole(project.team_id, req.user.id);
      })
      .then((teamRole) => {
        const permission = accessControl.can(teamRole.role).updateAny("project");
        if (!permission.granted) {
          throw new Error(401);
        }

        return projectController.update(req.params.id, req.body);
      })
      .then((project) => {
        return res.status(200).send(project);
      })
      .catch((error) => {
        if (error.message === "401") {
          return res.status(401).send({ error: "Not authorized" });
        }
        return res.status(400).send(error);
      });
  });
  // -------------------------------------------

  /*
  ** Route to remove a project
  */
  app.delete("/project/:id", verifyToken, (req, res) => {
    return projectController.findById(req.params.id)
      .then((project) => {
        return teamController.getTeamRole(project.team_id, req.user.id);
      })
      .then((teamRole) => {
        const permission = accessControl.can(teamRole.role).deleteAny("project");
        if (!permission.granted) {
          throw new Error(401);
        }

        return projectController.remove(req.params.id);
      })
      .then(() => {
        return res.status(200).send({ removed: true });
      })
      .catch((error) => {
        return res.status(400).send(error);
      });
  });
  // -------------------------------------------

  /*
  ** Route return a list of project within a team
  */
  app.get("/project/team/:team_id", verifyToken, (req, res) => {
    return teamController.getTeamRole(req.params.team_id, req.user.id)
      .then((teamRole) => {
        const permission = accessControl.can(teamRole.role).readAny("project");
        if (!permission.granted) {
          throw new Error(401);
        }

        return projectController.getTeamProjects(req.params.team_id);
      })
      .then((projects) => {
        return res.status(200).send(projects);
      })
      .catch((error) => {
        if (error.message === "401") {
          return res.status(401).send({ error: "Not authorized" });
        }
        return res.status(400).send(error);
      });
  });
  // -------------------------------------------

  /*
  ** Route to get a project with a public dashboard
  */
  app.get("/project/dashboard/:brewName", (req, res) => {
    return projectController.getPublicDashboard(req.params.brewName)
      .then((dashboard) => {
        return res.status(200).send(dashboard);
      })
      .catch((error) => {
        return res.status(400).send(error);
      });
  });
  // -------------------------------------------

  return (req, res, next) => {
    next();
  };
};
