import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as bandsService from "../services/bands.service";
import { cloudinaryProvider } from "../providers/cloudinary.provider";

const p = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v ?? "");

export const createBand = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const artistId = req.user!.id;
    const { name, bio, genre, specialties, country, city } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "El nombre de la banda es requerido" });
    if (!country || !city) return res.status(400).json({ error: "País y ciudad son requeridos" });

    const band = await bandsService.createBand(artistId, { name, bio, genre, specialties, country, city });
    res.status(201).json(band);
  } catch (err) { next(err); }
};

export const getMyBands = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bands = await bandsService.getMyBands(req.user!.id);
    res.json({ bands });
  } catch (err) { next(err); }
};

export const getMyBand = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const band = await bandsService.getMyBand(req.user!.id);
    res.json(band);
  } catch (err) { next(err); }
};

export const deleteBand = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await bandsService.deleteBand(p(req.params.id), req.user!.id);
    res.status(204).send();
  } catch (err) { next(err); }
};

export const getBand = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const band = await bandsService.getBandById(p(req.params.id));
    res.json(band);
  } catch (err) { next(err); }
};

export const searchBands = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string) || "";
    const city = req.query.city as string | undefined;
    const results = await bandsService.searchBands(q, city);
    res.json(results);
  } catch (err) { next(err); }
};

export const updateBand = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const band = await bandsService.updateBand(p(req.params.id), req.user!.id, req.body);
    res.json(band);
  } catch (err) { next(err); }
};

export const inviteMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { artistId, role, inviteMessage } = req.body;
    if (!artistId) return res.status(400).json({ error: "artistId es requerido" });
    const member = await bandsService.inviteMember(p(req.params.id), req.user!.id, artistId, role, inviteMessage);
    res.status(201).json(member);
  } catch (err) { next(err); }
};

export const respondToInvite = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { accept } = req.body;
    const member = await bandsService.respondToInvite(p(req.params.id), req.user!.id, !!accept);
    res.json(member);
  } catch (err) { next(err); }
};

export const listMembers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const members = await bandsService.listMembers(p(req.params.id));
    res.json(members);
  } catch (err) { next(err); }
};

export const removeMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await bandsService.removeMember(p(req.params.id), req.user!.id, p(req.params.artistId));
    res.status(204).send();
  } catch (err) { next(err); }
};

// ── Postulaciones ─────────────────────────────────────────────────────────────

export const createOpening = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role, description, slots } = req.body;
    if (!role?.trim()) return res.status(400).json({ error: "El rol buscado es requerido" });
    const opening = await bandsService.createOpening(p(req.params.id), req.user!.id, { role, description, slots });
    res.status(201).json(opening);
  } catch (err) { next(err); }
};

export const listOpenings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const openings = await bandsService.listOpenings(p(req.params.id));
    res.json(openings);
  } catch (err) { next(err); }
};

export const closeOpening = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const opening = await bandsService.closeOpening(p(req.params.oid), req.user!.id);
    res.json(opening);
  } catch (err) { next(err); }
};

export const applyToOpening = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const application = await bandsService.applyToOpening(p(req.params.oid), req.user!.id, req.body.message);
    res.status(201).json(application);
  } catch (err) { next(err); }
};

export const listApplications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const applications = await bandsService.listApplications(p(req.params.oid), req.user!.id);
    res.json(applications);
  } catch (err) { next(err); }
};

export const respondToApplication = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { accept } = req.body;
    const result = await bandsService.respondToApplication(p(req.params.aid), req.user!.id, !!accept);
    res.json(result);
  } catch (err) { next(err); }
};

export const requestToJoin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const member = await bandsService.requestToJoin(p(req.params.id), req.user!.id);
    res.status(201).json(member);
  } catch (err) { next(err); }
};

export const getAllOpenings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string) || undefined;
    const openings = await bandsService.getAllOpenings(q);
    res.json(openings);
  } catch (err) { next(err); }
};

export const getMyInvitations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const invitations = await bandsService.getMyInvitations(req.user!.id);
    res.json(invitations);
  } catch (err) { next(err); }
};

export const uploadBandAvatar = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bandId = p(req.params.id);
    if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo." });

    const band = await bandsService.getBandById(bandId);
    if (!band) return res.status(404).json({ error: "Banda no encontrada." });

    const oldAvatar = (band as any).avatar as string | null;
    const avatarUrl = await cloudinaryProvider.uploadBandAvatar(req.file.buffer, bandId);

    const updated = await bandsService.updateBand(bandId, req.user!.id, { avatar: avatarUrl });

    if (oldAvatar) cloudinaryProvider.deleteBandAvatar(oldAvatar).catch(() => {});

    res.json(updated);
  } catch (err) { next(err); }
};
